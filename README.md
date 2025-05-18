# MCP server for OpenAPI schemas

A Model Context Protocol (MCP) server that converts OpenAPI schemas (3.0, 3.1) to MCP tools. This server allows AI assistants to interact with your APIs through the MCP protocol.

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create an `openapi` folder in the root directory and place your OpenAPI YAML files inside:
   ```bash
   mkdir -p openapi
   # Copy example files from the examples folder
   cp examples/*.yaml openapi/
   ```
   
   You can add multiple OpenAPI YAML files to the `openapi` folder. The server will automatically load and convert all YAML files in this directory, making all APIs available through a single MCP server instance.

3. Security Configuration:
   - Currently, only API key authentication is supported
   - You'll need to set environment variables according to the header names defined in your OpenAPI schemas
   - For example, if your security scheme uses a header named `API_KEY`, you'll need to set an environment variable with the same name

## Configuration for Windsurf

To use this MCP server with Windsurf, add the following configuration to your MCP config file:

```json
"openapi": {
  "command": "node",
  "args": ["path/to/mcp-server/index.js", "stdio"],
  "env": {
    "API_KEY": "your-api-key-value"
  }
}
```

Make sure to:
- Replace `path/to/mcp-server` with the actual path to this repository on your system
- Add any required environment variables based on your API's security requirements

## Development Setup

1. Run the server in SSE mode:
   ```bash
   npm run start:sse
   ```

2. Run the MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector node
   ```

3. In the MCP Inspector:
   - Choose transport type: `SSE`
   - Enter URL: `http://localhost:3000/sse`
   - Press `Connect`


## License

ISC
