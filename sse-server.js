const path = require('path');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const OpenApiToMcp = require('./src/openapi-to-mcp');
const SseHttpServer = require('./src/server/sse-http-server');

// Load OpenAPI schema and create a configured MCP server
async function createConfiguredMcpServer() {
  try {
    // Create a new MCP server instance
    const server = new McpServer({
      name: "OpenAPI MCP Server",
      version: "1.0.0",
    });
    
    // Load OpenAPI schema
    const openApiFilePath = path.resolve(__dirname, "openapi.yaml");
    const converter = new OpenApiToMcp();
    
    // Configure API client options
    const apiOptions = {
      // You can override the base URL from the schema
      // baseUrl: 'http://custom-api.example.com',
      
      // Set custom headers if needed
      headers: {
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
        // 'X-API-Key': 'YOUR_API_KEY_HERE',
      },
      
      // Set request timeout (default is 30000ms)
      timeout: 10000
    };
    
    // Load schema and register tools BEFORE returning the server
    await converter.loadFromFile(openApiFilePath);
    await converter.generateMcpServerTools(server, apiOptions);
    
    return server;
  } catch (error) {
    console.error("Failed to configure MCP server:", error);
    throw error;
  }
}

// Start the HTTP server
async function startServer() {
  try {
    // Create the HTTP server
    const httpServer = new SseHttpServer({
      port: process.env.PORT || 3000,
      host: process.env.HOST || 'localhost'
    });
    
    // Set the MCP server factory - this is an async function that returns a fully configured server
    httpServer.setMcpServerFactory(createConfiguredMcpServer);
    
    // Start the server
    await httpServer.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      try {
        // Set a timeout to force exit if shutdown takes too long
        const forceExitTimeout = setTimeout(() => {
          console.log('Forcing exit after timeout');
          process.exit(1);
        }, 3000);
        
        // Stop the server
        await httpServer.stop();
        
        // Clear the timeout if shutdown completes normally
        clearTimeout(forceExitTimeout);
        console.log('Shutdown completed successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Also handle SIGTERM for container environments
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down...');
      try {
        await httpServer.stop();
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
