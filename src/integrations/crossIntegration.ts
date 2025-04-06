import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { FigmaConnector } from "./figma/connector.js";
import { MagicMcpConnector } from "./magicMcp/connector.js"; // Using placeholder
import { ToolManager } from "../utils/toolManager.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnyModel } from "@ai-sdk/provider";

// Helper function to get provider
function getProvider(modelName: string): AnyModel {
  if (modelName.startsWith('gpt')) {
    return openai(modelName);
  }
  throw new Error(`Unsupported model provider for: ${modelName}`);
}

// Define schema for the enhanced component output
const enhancedComponentSchema = z.object({
  code: z.string().describe("The generated component code (e.g., JSX, Vue SFC)"),
  styling: z.string().optional().describe("Associated styling code"),
  explanation: z.string().describe("Explanation of how the Figma design, inspiration, and enhancements were combined"),
  notes: z.string().optional().describe("Additional implementation notes")
});

// Define input schema for the tool
const enhancedComponentInputSchema = z.object({
  figmaUrl: z.string().url().describe("Figma file or node URL"),
  enhancementPrompt: z.string().describe("Prompt describing desired enhancements or changes"),
  framework: z.enum(["react", "vue", "svelte", "angular", "webcomponent"]).default("react").describe("Target UI framework"),
  styling: z.enum(["css", "tailwind", "styled-components", "scss", "css-modules"]).default("tailwind").describe("Styling method to use"),
  model: z.string().default("gpt-4o").describe("LLM to use for generation")
});
type EnhancedComponentInput = z.infer<typeof enhancedComponentInputSchema>;

export function registerCrossIntegrationTools(server: McpServer, toolManager: ToolManager) {
  // Use placeholder connectors
  const figma = new FigmaConnector();
  const magic = new MagicMcpConnector();
  
  // This tool is now less critical if using Pathway 2 (AI orchestration),
  // but we leave it registered. It demonstrates the composite pattern.
  toolManager.registerTool(
    "generate_enhanced_component_from_figma",
    'core', // Assign to 'core' for general availability, or a new 'cross' category
    enhancedComponentInputSchema, // Use defined schema
    async ({ figmaUrl, enhancementPrompt, framework, styling, model }: EnhancedComponentInput) => { // Use inferred type
      try {
        console.log("Executing cross-integration: generate_enhanced_component_from_figma");
        
        // Step 1: Extract Figma design (using placeholder)
        console.log(`Step 1: Extracting Figma design from ${figmaUrl}`);
        const designData = await figma.extractDesign(figmaUrl);
        console.log("Step 1: Figma design extracted (placeholder data).");

        // Step 2: Get inspiration from magic-mcp (using placeholder)
        console.log(`Step 2: Getting inspiration from magic-mcp for: "${enhancementPrompt}"`);
        const inspiration = await magic.getComponentInspiration(enhancementPrompt);
        console.log(`Step 2: Inspiration received: "${inspiration}"`);

        // Step 3: Generate enhanced component using Vercel AI SDK
        console.log(`Step 3: Generating ${framework} component with ${styling}...`);
        const provider = getProvider(model);
        const systemPrompt = `You are an expert ${framework} developer using ${styling}. Convert a Figma design into a component, incorporating the provided design inspiration and specific enhancement requests. Explain your choices clearly.`;
        const userPrompt = `
          Figma Design Data (JSON): ${JSON.stringify(designData, null, 2)}
          
          Design Inspiration: ${inspiration}
          
          Enhancement Request: ${enhancementPrompt}
          
          Task: Create an enhanced ${framework} component using ${styling}. Maintain the core structure from the Figma design while integrating the inspiration and implementing the enhancement request. Provide the component code, styling, and an explanation of your design decisions.
        `;

        const { object: enhancedComponent } = await generateObject({
          model: provider,
          schema: enhancedComponentSchema,
          prompt: userPrompt,
          system: systemPrompt
        });
        console.log("Step 3: Enhanced component generated.");
        
        return {
          object: enhancedComponent
        };
      } catch (error: any) {
         console.error("Error in generate_enhanced_component_from_figma tool:", error);
        return {
          error: `Cross-integration failed: ${error.message}`
        };
      }
    }
  );
  console.log("Registered cross-integration tools (Note: This tool represents Pathway 1)");
} 