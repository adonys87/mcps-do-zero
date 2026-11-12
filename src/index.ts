import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer } from "./mcp.ts";

async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error("Encrypt MCP server is running on stdio.");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});