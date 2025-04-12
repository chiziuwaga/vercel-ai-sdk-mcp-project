# Vercel AI SDK MCP Server Project

[![smithery badge](https://smithery.ai/badge/@chiziuwaga/vercel-ai-sdk-mcp-project)](https://smithery.ai/server/@chiziuwaga/vercel-ai-sdk-mcp-project)

This repository contains a Model Context Protocol (MCP) server designed to expose capabilities of the Vercel AI SDK Core to AI development environments like Cursor. It allows leveraging features like `generateObject`, `generateText`, `streamText`, and UI generation alongside other MCP servers (like `mcp-figma` and `magic-mcp` via Smithery).

## Core Features

*   **Vercel AI SDK Integration:** Provides MCP tools wrapping core Vercel AI SDK functions (`generate_object`, `generate_ui_component`, etc.).
*   **Tool Categorization:** Implements a `ToolManager` with a `set_tool_category` meta-tool to manage the number of active tools exposed to Cursor, keeping within reasonable limits.
*   **Figma/Magic MCP Placeholders:** Includes placeholder connectors and tool registrations for `mcp-figma` and `magic-mcp`, intended for orchestration via Cursor AI (Pathway 2).
*   **Smithery Deployment Ready:** Configured with `Dockerfile` and `smithery.yaml` for easy deployment on [Smithery.ai](https://smithery.ai/).
*   **Cursor Integration:** Designed to be used within Cursor via the `.cursor/mcp.json` configuration.

## Architectural Approach (Pathway 2 Orchestration)

This server is primarily designed to be one component in a multi-MCP workflow orchestrated by the AI within Cursor (Pathway 2).

The intended workflow involves:
1.  Using prompts and Cursor Rules (`.cursor/rules/`) to guide the AI.
2.  Making sequential calls to different MCP servers:
    *   `mcp-figma` (via Smithery) for design extraction.
    *   `magic-mcp` (via Smithery) for inspiration/component building.
    *   This `vercel-ai-sdk-mcp` server for Vercel AI SDK specific tasks (like structured generation).
3.  The AI combines context from each step to achieve the final goal.

While a composite tool (`generate_enhanced_component_from_figma`) demonstrating direct server-to-server interaction (Pathway 1) exists in the code (`src/integrations/crossIntegration.ts`), it requires implementing functional MCP clients within the connectors and is not the primary intended usage pattern for this setup.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v20 or later recommended)
*   [npm](https://www.npmjs.com/)
*   [Git](https://git-scm.com/)
*   [Cursor](https://cursor.sh/)
*   [Smithery Account](https://smithery.ai/) (for deployment)
*   **API Keys:**
    *   OpenAI API Key (Required)
    *   Figma API Key (Required for *implementing* Figma integration)
    *   21st Dev API Key (Required for *implementing* Magic MCP integration)

## Local Setup

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/chiziuwaga/vercel-ai-sdk-mcp-project.git
    cd vercel-ai-sdk-mcp-project
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` File:**
    Copy `.env.example` to `.env` and fill in your API keys:
    ```dotenv
    OPENAI_API_KEY=sk-your-openai-key
    ANTHROPIC_API_KEY=sk-ant-your-anthropic-key # Optional
    FIGMA_API_KEY=your-figma-key              # For future implementation
    TWENTY_FIRST_API_KEY=your-21st-key        # For future implementation
    TRANSPORT_TYPE=stdio                      # Keep as stdio for local
    PORT=3000                                 # Only used if TRANSPORT_TYPE=sse
    ```
4.  **Build the Code:**
    ```bash
    npm run build
    ```
5.  **Run Locally:**
    ```bash
    npm run start
    ```
    The server will be running using stdio, waiting for connections.

## Cursor Integration (Local)

To use the *local* server in Cursor:

1.  Ensure `mcp-figma` and `magic-mcp` are runnable via `npx` locally.
2.  Modify your workspace `.cursor/mcp.json` to run this server directly with Node:

    ```json
    {
      "mcpServers": {
        "magic-mcp": { ... }, // Keep existing Smithery config
        "mcp-figma": { ... }, // Keep existing Smithery config
        "vercel-ai-sdk-mcp": {
          "command": "node",
          "args": ["dist/index.js"], // Path relative to workspace root
          "env": { // Pass keys directly for local run
            "OPENAI_API_KEY": "${OPENAI_API_KEY}",
            "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
            "FIGMA_API_KEY": "${FIGMA_API_KEY}",
            "TWENTY_FIRST_API_KEY": "${TWENTY_FIRST_API_KEY}",
            "TRANSPORT_TYPE": "stdio"
          }
        }
      }
    }
    ```
3.  Make sure the `${API_KEY}` variables are accessible in your environment where Cursor can read them.

## Usage Example (Pathway 2)

1.  **Ensure MCP Servers are running** (locally or configured via Smithery in `.cursor/mcp.json`).
2.  **Create Cursor Rules:** Add rule files in `.cursor/rules/` to guide the AI (see section below).
3.  **Prompt Cursor AI:** Give a multi-step prompt like the User Story described previously, instructing the AI to call tools sequentially across `mcp-figma`, `magic-mcp`, and `vercel-ai-sdk-mcp`.

    *Example Snippet:*
    ```
    "First, use mcp-figma's extract_figma_design... Then use magic-mcp's inspiration tool... Finally, use vercel-ai-sdk-mcp's generate_ui_component with the combined context..."
    ```

## Cursor Rules (`.cursor/rules/`)

Effective use of the Pathway 2 orchestration relies on creating guidance rules for the Cursor AI. You **must** create a `.cursor/rules/` directory in your project root and add rule files (e.g., `figma.cursorule`, `magic.cursorule`, `vercel.cursorule`).

*   These files should contain natural language instructions on:
    *   Which tools to use from each MCP server for specific tasks.
    *   How to structure prompts for those tools.
    *   How to pass context (data) between sequential tool calls.
    *   Standard workflows (e.g., Figma -> Magic -> Vercel).

Refer to the [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai) for syntax and examples.

## Deployment (Smithery)

1.  **Push to GitHub:** Ensure your latest code, including `Dockerfile` and `smithery.yaml`, is pushed to the `main` branch on GitHub.
2.  **Go to Smithery.ai:** Log in and find/add your `chiziuwaga/vercel-ai-sdk-mcp-project` server.
3.  **Deploy:** Go to the "Deployments" tab and click "Create Deployment".
4.  **Configure:** Provide the **required** API keys (`openaiApiKey`, etc.) when prompted by Smithery. These are stored securely.
5.  **Launch:** Start the deployment process. Smithery builds the Docker image and runs the container.

## Cursor Integration (Deployed)

Once deployed on Smithery:

1.  Update your `.cursor/mcp.json` to use the Smithery CLI runner for your server (this should match the current content):

    ```json
    {
      "mcpServers": {
        "magic-mcp": { ... }, // Keep existing Smithery config
        "mcp-figma": { ... }, // Keep existing Smithery config
        "vercel-ai-sdk-mcp": {
          "command": "npx",
          "args": [
            "-y", "@smithery/cli@latest", "run",
            "chiziuwaga/vercel-ai-sdk-mcp-project",
            "--config",
            // Ensure these env vars are available to Cursor
            "{"openaiApiKey":"${OPENAI_API_KEY}", "anthropicApiKey":"${ANTHROPIC_API_KEY}", "figmaApiKey":"${FIGMA_API_KEY}", "twentyFirstApiKey":"${TWENTY_FIRST_API_KEY}", "transportType":"stdio"}"
          ]
        }
      }
    }
    ```
2.  Ensure the `${API_KEY}` variables referenced in the `--config` JSON string are accessible to Cursor from your environment.

## Configuration

API Keys are required for full functionality:

*   `OPENAI_API_KEY`: **Required** for Vercel AI SDK tools. Provide during Smithery deployment config or in `.env` for local runs.
*   `ANTHROPIC_API_KEY`: Optional, for Anthropic models.
*   `FIGMA_API_KEY`: Required **only** when `FigmaConnector` is implemented.
*   `TWENTY_FIRST_API_KEY`: Required **only** when `MagicMcpConnector` is implemented.

## Placeholders & Future Work

*   **Implement Connectors:** The `src/integrations/figma/connector.ts` and `src/integrations/magicMcp/connector.ts` contain **placeholders**. They need to be implemented with actual API calls (for Figma) and MCP client logic (potentially for Magic MCP, depending on its interface) to enable the integration tools.
*   **Add More Tools:** Implement the remaining Vercel AI SDK tools (text generation, streaming, chat, code gen, etc.) as outlined in the specs.
*   **Error Handling:** Enhance error handling, especially around missing API keys.
*   **Testing:** Add automated tests.

## License

ISC License (as per `package.json`). 