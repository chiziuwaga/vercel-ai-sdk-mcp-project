import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { config } from "./config.js";
import { ToolManager } from "./utils/toolManager.js";
import { registerCoreTools } from "./tools/core/index.js";
import { registerUITools } from "./tools/ui/index.js";
// import { registerCodeTools } from "./tools/code/index.js"; // Not implemented in this pass
// import { registerDesignTools } from "./tools/design/index.js"; // Not implemented in this pass
import { registerFigmaIntegration } from "./integrations/figma/index.js"; // Uses placeholder
import { registerMagicMcpBridge } from "./integrations/magicMcp/index.js"; // Uses placeholder
import { registerCrossIntegrationTools } from "./integrations/crossIntegration.js"; // Uses placeholder connectors

// *** ADD THIS CHECK ***
if (!config.openaiApiKey) {
  console.error("\n!!! FATAL ERROR !!!");
  console.error("Missing required environment variable: OPENAI_API_KEY");
  console.error("Please ensure OPENAI_API_KEY is set in your environment (for local runs)");
  console.error("or provided during Smithery deployment configuration.");
  process.exit(1); // Exit immediately if key is missing
}
// *********************

// Create server instance
const server = new McpServer({
  name: "vercel-ai-sdk-mcp-project", // Match package.json name
  version: "1.0.0", // Match package.json version
  description: "MCP Server for Vercel AI SDK with Figma and magic-mcp integration (using placeholders)"
});

// Initialize tool manager
const toolManager = new ToolManager(server);

// Register tool categories 
console.log("Registering tools...");
registerCoreTools(server, toolManager);      // Includes generate_object, generate_enhanced_component_from_figma
registerUITools(server, toolManager);        // Includes generate_ui_component
// registerCodeTools(server, toolManager);   // Skipped
// registerDesignTools(server, toolManager); // Skipped
registerFigmaIntegration(server, toolManager); // Includes extract_figma_design, generate_component_from_figma (uses placeholders)
registerMagicMcpBridge(server, toolManager); // No tools registered yet (placeholder index file)
registerCrossIntegrationTools(server, toolManager); // This is registered within core tools now

// Register the composite tool manager AFTER all other tools are registered
// so it knows about all categories.
console.log("Registering tool manager...");
toolManager.registerCompositeTools(); // Includes set_tool_category

// Start with core tools active by default
toolManager.setActiveCategory('core');
console.log(`Default active tool category set to: '${toolManager.getActiveToolNames().join(', ')}'`);

// Start server function
async function startServer() {
  console.log(`Attempting to start server with ${config.transportType} transport...`);
  const transport = config.transportType === 'sse'
    ? new SSEServerTransport({ port: config.port })
    : new StdioServerTransport();
    
  try {
    await server.connect(transport);
    console.log(`Server connected successfully via ${config.transportType}. Ready for requests.`);
    if (config.transportType === 'sse') {
      console.log(`SSE Server listening on port ${config.port}`);
    }
  } catch (error) {
    console.error("FATAL: Failed to start MCP server:", error);
    // Ensure process exits if server fails to start
    process.exit(1); 
  }
}

// Execute server start
startServer(); 