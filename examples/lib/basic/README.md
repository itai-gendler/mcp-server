# Basic Library Integration Example

This example demonstrates how to use the MCP server as a library in your Node.js application.

## Use Case

This pattern is useful when:
- You want to embed MCP functionality within your own application
- You need to customize the server configuration
- You want to control the server's lifecycle programmatically

## Prerequisites

Make sure you have the required dependencies:

```bash
npm install @modelcontextprotocol/sdk
```

## Running the Example

```bash
# From this directory
node index.js
```

## How It Works

The example demonstrates:

1. Importing the MCP server as a module
2. Configuring the server with custom options
3. Specifying a custom OpenAPI schema directory
4. Connecting a transport (stdio in this case)

## Key Concepts

```javascript
// Create and configure server
const { server } = await mcpServer.createServer({
  // Custom OpenAPI directory
  openapiDir: schemasPath,
  
  // Server metadata
  serverConfig: { ... },
  
  // API client configuration
  apiOptions: { ... }
});

// Choose a transport
const transport = new StdioServerTransport();

// Connect the transport
server.connect(transport);
```

## Next Steps

Once you understand the basics:
- Try adding custom tools (see the custom-tools example)
- Integrate with a web framework (see the express-integration example)
- Experiment with different transport types
