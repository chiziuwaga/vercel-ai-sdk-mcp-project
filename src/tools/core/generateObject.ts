import { z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ToolManager } from "../../utils/toolManager.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnyModel } from "@ai-sdk/provider"; // Import AnyModel type

// Helper function to get the provider based on model name (extend as needed)
function getProvider(modelName: string): AnyModel {
  if (modelName.startsWith('gpt')) {
    // Assuming openai function can handle different model variants like gpt-4o, gpt-3.5-turbo etc.
    // Adjust if the library requires specific instances per model
    return openai(modelName);
  }
  // Add other providers here, e.g.:
  // if (modelName.startsWith('claude')) {
  //   return anthropic(modelName);
  // }
  throw new Error(`Unsupported model provider for: ${modelName}`);
}

// Define the input schema for the tool
const generateObjectInputSchema = z.object({
  prompt: z.string().describe("Text prompt describing the object to generate"),
  // Use z.custom for validation, but type it more generally for inference
  schema: z.custom<Record<string, ZodTypeAny>>( 
      (val): val is Record<string, ZodTypeAny> => typeof val === 'object' && val !== null && !Array.isArray(val), 
      "Must be a Zod schema definition shape (object mapping keys to Zod types)"
  ).describe("A Zod schema definition shape (object mapping keys to Zod types) for the object structure"),
  model: z.string().default("gpt-4o").describe("Model to use for generation (e.g., gpt-4o, gpt-3.5-turbo)")
});

// Infer the input type from the Zod schema
type GenerateObjectInput = z.infer<typeof generateObjectInputSchema>;

export function registerGenerateObjectTool(server: McpServer, toolManager: ToolManager) {
  toolManager.registerTool(
    "generate_object",
    'core',
    generateObjectInputSchema, // Use the defined schema
    async ({ prompt, schema: schemaShape, model }: GenerateObjectInput) => { // Use inferred type
      try {
        const provider = getProvider(model);

        // Dynamically create the Zod schema from the shape definition passed in.
        // IMPORTANT: Directly creating Zod schemas from untrusted input is a security risk.
        // In a real application, sanitize/validate schemaShape rigorously.
        const dynamicSchema = z.object(schemaShape); // schemaShape is now the Record<string, ZodTypeAny>

        const { object } = await generateObject({
          model: provider,
          schema: dynamicSchema, // Use the dynamically created Zod schema
          prompt: prompt,
          // You might structure messages differently depending on the model/provider
          // messages: [
          //   { role: "user", content: prompt }
          // ]
        });

        return {
          // Return the generated object directly, MCP handles content wrapping
          object: object 
        };
      } catch (error: any) {
        console.error("Error in generate_object tool:", error);
        return {
          error: `Failed to generate object: ${error.message}`
        };
      }
    }
  );
} 