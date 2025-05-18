const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const path = require("path");
const OpenApiToMcp = require("../../src/openapi-to-mcp");

// Create an MCP server
const server = new McpServer({
  name: "OpenAPI MCP Server",
  version: "1.0.0",
});

// Load and convert OpenAPI schema to MCP tools
async function loadOpenApiTools() {
  try {
    // Load from the openapi directory
    const openApiDirPath = path.resolve(__dirname, "../../openapi");
    const converter = new OpenApiToMcp();

    await converter.loadFromDirectory(openApiDirPath);

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
      "Successfully loaded OpenAPI schemas from directory and generated MCP tools with API client functionality"
    );

    // Option 2: Load from a single file (commented out - uncomment to use)
    /*
    // Example file path - replace with your actual OpenAPI file path
    const openApiFilePath = path.resolve(__dirname, "../../openapi.yaml");
    const fileConverter = new OpenApiToMcp();
    
    await fileConverter.loadFromFile(openApiFilePath);
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

  console.log("MCP Server started with stdio transport");
}

// Start the server
initServer().catch(console.error);
