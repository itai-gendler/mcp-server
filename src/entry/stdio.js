const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const path = require("path");
const OpenApiToMcp = require("../../src/openapi-to-mcp");

/**
 * Create a stdio server with the given options
 * @param {object} options - Server options
 * @param {object} options.server - Pre-configured MCP server instance
 * @returns {Promise<object>} - Object with server and transport instances
 */
async function createServer(options = {}) {
  if (!options.server) {
    throw new Error("A pre-configured server instance is required");
  }

  // Create transport
  const transport = new StdioServerTransport();

  return { server: options.server, transport };
}

/**
 * Start the STDIO server with the given options
 * @param {object} options - Server options
 * @param {object} options.server - Pre-configured MCP server instance
 * @returns {Promise<object>} - Object with server and transport instances
 */
async function startServer(options = {}) {
  try {
    const { server, transport } = await createServer(options);

    // Connect the server to the transport
    await server.connect(transport);

    console.log("MCP Server started with stdio transport");

    return { server, transport };
  } catch (error) {
    console.error("Error starting server:", error);
    throw error;
  }
}

// Export only what's needed for index.js
module.exports = {
  startServer,
};
