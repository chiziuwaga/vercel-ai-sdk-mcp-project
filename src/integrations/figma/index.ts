import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolManager } from "../../utils/toolManager.js";
import { registerFigmaTools } from './figmaTools.js';

export function registerFigmaIntegration(server: McpServer, toolManager: ToolManager) {
  registerFigmaTools(server, toolManager);
  console.log("Registered Figma integration tools (using placeholders)");
} 