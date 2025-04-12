import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolManager } from "../../utils/toolManager.js";
import { registerGenerateUIComponentTool } from "./generateUIComponent.js";
// Import other UI tools when implemented
// import { registerLayoutGeneratorTool } from './layoutGenerator.js';

export function registerUITools(server: McpServer, toolManager: ToolManager) {
  registerGenerateUIComponentTool(server, toolManager);
  // registerLayoutGeneratorTool(server, toolManager);
  console.log("Registered UI tools");
} 