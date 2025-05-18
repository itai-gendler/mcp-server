const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const path = require("path");
const OpenApiToMcp = require("./src/openapi-to-mcp");

// Create an MCP server
const server = new McpServer({
  name: "OpenAPI MCP Server",
  version: "1.0.0",
});

// Load and convert OpenAPI schema to MCP tools
async function loadOpenApiTools() {
  try {
    // Option 1: Load from a local file (default)
    const openApiFilePath = path.resolve(__dirname, "openapi.yaml");
    const converter = new OpenApiToMcp();

    await converter.loadFromFile(openApiFilePath);

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
      timeout: 10000,
    };

    // Generate MCP tools with API client functionality
    await converter.generateMcpServerTools(server, apiOptions);

    console.log(
      "Successfully loaded OpenAPI schema from file and generated MCP tools with API client functionality"
    );

    // Option 2: Load from a URL (commented out - uncomment to use)
    /*
    // Example URL - replace with your actual OpenAPI URL
    const openApiUrl = 'https://example.com/api/openapi.yaml';
    const urlConverter = new OpenApiToMcp();
    
    await urlConverter.loadFromUrl(openApiUrl);
    await urlConverter.generateMcpServerTools(server, apiOptions);
    
    console.log("Successfully loaded OpenAPI schema from URL and generated MCP tools");
    */
  } catch (error) {
    console.error("Failed to load OpenAPI schema:", error);
  }
}

// Initialize the server
async function initServer() {
  // Load OpenAPI tools
  await loadOpenApiTools();

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);

  console.log("MCP Server started");
}

// Start the server
initServer().catch(console.error);
