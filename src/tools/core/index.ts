import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolManager } from "../../utils/toolManager.js";
import { registerGenerateObjectTool } from "./generateObject.js";
// Import other core tools when implemented
// import { registerGenerateTextTool } from './generateText.js'; 
// import { registerStreamTextTool } from './streamText.js';
// import { registerChatCompletionTool } from './chatCompletion.js';

export function registerCoreTools(server: McpServer, toolManager: ToolManager) {
  registerGenerateObjectTool(server, toolManager);
  // registerGenerateTextTool(server, toolManager);
  // registerStreamTextTool(server, toolManager);
  // registerChatCompletionTool(server, toolManager);
  console.log("Registered core tools");
} 