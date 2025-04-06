import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { FigmaConnector } from "./connector.js";
import { ToolManager } from "../../utils/toolManager.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnyModel } from "@ai-sdk/provider";

// Helper function to get provider
function getProvider(modelName: string): AnyModel {
  if (modelName.startsWith('gpt')) {
    return openai(modelName);
  }
  throw new Error(`Unsupported model provider for: ${modelName}`);
}

// Define schema for component generation output
const generatedComponentSchema = z.object({
  code: z.string().describe("The generated component code (e.g., JSX, Vue SFC)"),
  styling: z.string().optional().describe("Associated styling code (e.g., CSS, Tailwind classes)"),
  notes: z.string().optional().describe("Notes on implementation or assumptions made")
});

// Define input schemas for tools
const extractDesignInputSchema = z.object({
  fileUrl: z.string().url().describe("Full Figma file URL (e.g., https://www.figma.com/file/...) or node URL"),
  nodeId: z.string().optional().describe("Optional specific node ID to extract")
});
type ExtractDesignInput = z.infer<typeof extractDesignInputSchema>;

const generateFromFigmaInputSchema = z.object({
  figmaInput: z.union([
    z.string().url().describe("Figma file or node URL to extract from"),
    z.object({}).passthrough().describe("Pre-extracted Figma design data object") // Keep flexible for now
  ]).describe("Either a Figma URL or pre-extracted design data object"),
  framework: z.enum(["react", "vue", "svelte", "angular", "webcomponent"]).default("react").describe("Target UI framework"),
  styling: z.enum(["css", "tailwind", "styled-components", "scss", "css-modules"]).default("tailwind").describe("Styling method to use"),
  model: z.string().default("gpt-4o").describe("LLM to use for generation")
});
type GenerateFromFigmaInput = z.infer<typeof generateFromFigmaInputSchema>;

export function registerFigmaTools(server: McpServer, toolManager: ToolManager) {
  // Use the placeholder connector
  const figma = new FigmaConnector(); 
  
  // Tool to extract design data from Figma
  toolManager.registerTool(
    "extract_figma_design",
    'figma',
    extractDesignInputSchema, // Use defined schema
    async ({ fileUrl, nodeId }: ExtractDesignInput) => { // Use inferred type
      try {
        // Using the placeholder connector method
        const designData = await figma.extractDesign(fileUrl, nodeId); 
        return {
          object: designData // Return the extracted data as an object
        };
      } catch (error: any) {
         console.error("Error in extract_figma_design tool:", error);
        return {
          error: `Failed to extract Figma design: ${error.message}`
        };
      }
    }
  );
  
  // Tool to generate a UI component based on Figma design data
  toolManager.registerTool(
    "generate_component_from_figma",
    'figma', // Keep it in the figma category, as it starts with Figma input
    generateFromFigmaInputSchema, // Use defined schema
    async ({ figmaInput, framework, styling, model }: GenerateFromFigmaInput) => { // Use inferred type
      try {
        let designData: any;
        // If input is a string (URL), extract the design first
        if (typeof figmaInput === 'string') {
          console.log("Figma URL provided, extracting design first...");
          designData = await figma.extractDesign(figmaInput);
        } else {
          console.log("Pre-extracted Figma data provided.");
          designData = figmaInput; // Assume it's already the data object
        }

        const provider = getProvider(model);

        const systemPrompt = `You are an expert in converting Figma designs into clean, production-ready ${framework} components using ${styling}. Analyze the provided Figma design structure and generate the corresponding component code.`;
        const userPrompt = `Convert the following Figma design data into a ${framework} component using ${styling}:\n\n${JSON.stringify(designData, null, 2)}`;

        // Generate component using Vercel AI SDK's generateObject
        const { object: generatedComponent } = await generateObject({
          model: provider,
          schema: generatedComponentSchema,
          prompt: userPrompt,
          system: systemPrompt
        });

        return {
          object: generatedComponent
        };
      } catch (error: any) {
        console.error("Error in generate_component_from_figma tool:", error);
        return {
          error: `Failed to generate component from Figma: ${error.message}`
        };
      }
    }
  );
} 