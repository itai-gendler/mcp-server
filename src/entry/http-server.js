const StreamableHttpServer = require("../../src/server/streamable-http-server");

/**
 * Create a streamable HTTP server
 * @param {object} options - Server options
 * @param {object} options.server - Pre-configured MCP server instance
 * @param {number} options.port - Port to listen on
 * @param {string} options.host - Host to bind to
 * @returns {Promise<object>} - The server instance
 */
async function createServer(options = {}) {
  if (!options.server) {
    throw new Error("A pre-configured server instance is required");
  }

  // Set defaults
  const {
    port = process.env.PORT || 3000,
    host = process.env.HOST || "localhost",
    server,
  } = options;

  // Create the HTTP server
  const httpServer = new StreamableHttpServer({
    port,
    host,
  });

  // Create a factory function that will return the pre-configured server
  const serverFactory = () => Promise.resolve(server);

  // Set the MCP server factory
  httpServer.setMcpServerFactory(serverFactory);

  return httpServer;
}

/**
 * Start the HTTP server with the given options
 * @param {object} options - Server options
 * @param {object} options.server - Pre-configured MCP server instance
 * @returns {Promise<object>} - The server instance
 */
async function startServer(options = {}) {
  try {
    const httpServer = await createServer(options);

    // Start the server
    await httpServer.start();

    return httpServer;
  } catch (error) {
    console.error("Error starting server:", error);
    throw error;
  }
}

// Export only what's needed for index.js
module.exports = {
  startServer,
};
