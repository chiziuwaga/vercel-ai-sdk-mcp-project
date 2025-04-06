import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Define the possible tool categories based on the spec
export type ToolCategory = 'core' | 'ui' | 'code' | 'design' | 'figma' | 'magic' | string; // Allow string for extensibility if needed

export class ToolManager {
  private server: McpServer;
  private registeredTools: Map<string, { category: ToolCategory, handler: Function, schema: z.ZodObject<any> }> = new Map();
  private activeCategory: ToolCategory | null = null;

  constructor(server: McpServer) {
    this.server = server;
  }

  // Register tool with category
  registerTool(name: string, category: ToolCategory, schema: z.ZodObject<any>, handler: Function) {
    this.registeredTools.set(name, { category, schema, handler });

    // Register composite tool handler that checks if category is active
    // This ensures the MCP server's tool list isn't overwhelmed
    this.server.tool(
      name,
      schema,
      async (params: any) => {
        const toolInfo = this.registeredTools.get(name);
        if (!toolInfo) {
          // Should not happen if registration is done correctly
          return { error: `Tool ${name} not found internally.` };
        }

        if (this.activeCategory !== null && this.activeCategory !== toolInfo.category) {
          console.warn(`Tool call blocked: ${name}. Current category: ${this.activeCategory}, Required: ${toolInfo.category}`);
          return {
            error: `Tool category mismatch. Tool '${name}' requires category '${toolInfo.category}', but current active category is '${this.activeCategory}'. Use 'set_tool_category' to switch.`
          };
        }
        // Call the actual handler only if the category matches or if no category is active
        try {
          return await toolInfo.handler(params);
        } catch (error: any) { // Catch specific errors from the handler
           console.error(`Error executing tool ${name}:`, error);
           return { error: `Tool execution failed: ${error.message || error}` };
        }
      }
    );
    console.log(`Registered tool: ${name} under category: ${category}`);

  }

  // Set active toolset by category - only exposes tools from that category via the check
  setActiveCategory(category: ToolCategory | null) {
    this.activeCategory = category;
    console.log(`Activated tool category: ${category || 'all'}`);
  }

  // Create composite tools that represent entire categories
  registerCompositeTools() {
    // Define the schema for the meta-tool input
    const setCategorySchema = z.object({
      // Dynamically generate the enum from registered categories plus 'all'
      category: z.enum([ 'all', ...new Set(Array.from(this.registeredTools.values()).map(t => t.category)) ] as [string, ...string[]]).describe("The tool category to activate. 'all' activates all tools.")
    });

    // Infer the type from the Zod schema
    type SetCategoryParams = z.infer<typeof setCategorySchema>;

    // Register a meta-tool that allows category switching
    this.server.tool(
      "set_tool_category",
      setCategorySchema,
      async ({ category }: SetCategoryParams) => { // Use inferred type here
        this.setActiveCategory(category === 'all' ? null : category);
        return {
          content: [{ 
            type: "text", 
            text: `Tool category set to: ${category}. ${this.getActiveCategoryToolsMessage()}` 
          }]
        };
      }
    );
     console.log(`Registered meta-tool: set_tool_category`);
  }

  // Generates a message listing available tools based on the active category
  private getActiveCategoryToolsMessage(): string {
    const availableTools = Array.from(this.registeredTools.entries())
      .filter(([name, toolInfo]) => this.activeCategory === null || toolInfo.category === this.activeCategory)
      .map(([name]) => name);
      
    if (availableTools.length === 0 && this.activeCategory !== null) {
        return `No tools registered under category '${this.activeCategory}'.`;
    }

    const message = this.activeCategory === null 
      ? "All tools are available:" 
      : `Available tools in category '${this.activeCategory}':`;
      
    return `${message} ${availableTools.join(', ')}. Use 'set_tool_category' to switch.`;
  }

  // Returns a list of tool names for the currently active category
  getActiveToolNames(): string[] {
     return Array.from(this.registeredTools.entries())
      .filter(([name, toolInfo]) => this.activeCategory === null || toolInfo.category === this.activeCategory)
      .map(([name]) => name);
  }
} 