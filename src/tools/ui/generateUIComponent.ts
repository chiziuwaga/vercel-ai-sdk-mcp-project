import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ToolManager } from "../../utils/toolManager.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnyModel } from "@ai-sdk/provider"; // Import AnyModel type

// Define the expected output structure for the UI component
const componentSchema = z.object({
  jsx: z.string().describe("The JSX/TSX code for the component"),
  css: z.string().optional().describe("Optional CSS code for styling"),
  props: z.record(z.string(), z.any()).optional().describe("Example props object or interface definition"), // Use z.string() for keys
  description: z.string().describe("A brief description of the generated component")
});

// Helper function to get the provider (can be shared or moved to a central utils)
function getProvider(modelName: string): AnyModel {
  if (modelName.startsWith('gpt')) {
    return openai(modelName);
  }
  throw new Error(`Unsupported model provider for: ${modelName}`);
}

// Define the input schema for the tool
const generateUIInputSchema = z.object({
  description: z.string().describe("Detailed description of the UI component needed"),
  framework: z.enum(["react", "vue", "svelte", "angular", "webcomponent"]).default("react").describe("Target UI framework"),
  style: z.enum(["minimal", "modern", "brutalist", "neumorphism", "glassmorphism"]).default("modern").describe("Desired visual style"),
  stylingLanguage: z.enum(["css", "scss", "less", "tailwind", "styled-components", "css-modules"]).default("css").describe("CSS preprocessor or library to use"),
  includeProps: z.boolean().default(true).describe("Whether to include example props or prop types")
});

// Infer the input type
type GenerateUIInput = z.infer<typeof generateUIInputSchema>;

export function registerGenerateUIComponentTool(server: McpServer, toolManager: ToolManager) {
  toolManager.registerTool(
    "generate_ui_component",
    'ui',
    generateUIInputSchema, // Use defined schema
    async ({ description, framework, style, stylingLanguage, includeProps }: GenerateUIInput) => { // Use inferred type
      try {
        // Currently hardcoding gpt-4o, but could make this configurable via input or config
        const model = "gpt-4o"; 
        const provider = getProvider(model);
        
        const systemPrompt = `You are an expert ${framework} UI developer specializing in creating ${style} style components using ${stylingLanguage}. Generate a functional and well-structured component based on the user's description. ${includeProps ? 'Include example props or a props interface definition.' : 'Do not include props definition.'}`;

        const { object: generatedComponent } = await generateObject({
          model: provider,
          schema: componentSchema, // Use the defined output schema
          prompt: description, 
          system: systemPrompt,
        });

        return {
          object: generatedComponent // Return the structured component object
        };
      } catch (error: any) {
        console.error("Error in generate_ui_component tool:", error);
        return {
          error: `Failed to generate UI component: ${error.message}`
        };
      }
    }
  );
} 