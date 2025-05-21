# MCP server for OpenAPI schemas

A Model Context Protocol (MCP) server that converts OpenAPI schemas (3.0, 3.1) to MCP tools. This server allows AI assistants to interact with your APIs through the MCP protocol.

## Features

- Automatic conversion of OpenAPI schemas to MCP tools
- Support for multiple transport types (stdio, SSE, HTTP streamable)
- Support for multiple OpenAPI files in a single directory
- Customizable OpenAPI directory path
- Can be used as a standalone CLI tool or as a library in other Node.js projects

## Prerequisites

1. Install dependencies:

   ```bash
   npm install
   ```

2. Prepare your OpenAPI schemas:
   - By default, the server looks for YAML files in an `openapi` directory at the project root
   - You can use your own schemas or the examples provided in `examples/schemas/`
   - Multiple OpenAPI files can be placed in the same directory and will be loaded automatically

3. Security Configuration:
   - Currently, only API key authentication is supported
   - Environment variables should be set to match header names in your OpenAPI schemas
   - Example: If your schema uses a header `API_KEY`, set that environment variable

## Usage

The MCP server can be used in two ways: as a standalone CLI tool or as a library in your Node.js projects.

### CLI Usage

#### Basic Commands

```bash
# Start with stdio transport (default)
npm start

# Start with SSE transport
npm run start:sse

# Start with HTTP Streamable transport
npm run start:stream

# Specify custom OpenAPI directory
node index.js <transport> --openapi-dir /path/to/schemas
```

#### Using OpenAPI Schemas with CLI

1. Create an openapi directory and copy schemas from examples:

```bash
mkdir -p openapi
cp examples/schemas/basic/* openapi/
```

2. Start the server with your preferred transport:

```bash
# Using stdio transport (default)
npm start

# Or explicitly specify the transport
node index.js stdio
```

You can also specify a custom directory for schemas:

```bash
node index.js stdio --openapi-dir ./path/to/schemas
```

### Library Usage

The MCP server can be imported and used as a module in your Node.js applications. This allows you to:

- Customize the OpenAPI schemas location
- Register custom tools, resources, and prompts
- Choose your preferred transport type
- Integrate with your existing applications

See the library usage examples in `examples/lib/` for complete integration patterns.

### Configuration for Windsurf

To use this MCP server with Windsurf:

#### Option 1: Run as a child process

Add an entry to your Windsurf MCP configuration file to run the server as a child process:

```json
"openapi": {
  "command": "node",
  "args": ["<path-to-mcp-server>/index.js", "stdio", "--openapi-dir", "<path-to-schemas>"],
  "env": {
    "API_KEY": "your-api-key-value"
  }
}
```

The `--openapi-dir` parameter is optional and can be used to specify a custom directory for your OpenAPI schemas.

#### Option 2: Connect to a running server

Alternatively, you can connect to an already running MCP server:

```json
"openapi": {
  "serverUrl": "http://localhost:3000/sse",
  "headers": {
    "Authorization": "Bearer your-token"
  }
}
```

With this configuration, Windsurf will connect directly to the server running at the specified URL instead of launching a new process.

## Development Setup

### Running the Server Locally

1. Run the server in SSE mode:

   ```bash
   npm run start:sse
   ```

2. Connect using the MCP Inspector:

   ```bash
   npx @modelcontextprotocol/inspector node
   ```
   
   Then choose `SSE` transport and connect to `http://localhost:3000/sse`

### Testing

```bash
# Run all tests
npm test

# Run specific test files
npm test -- tests/utils/arg-parser.test.js
```

## Examples

This repository includes examples to help you get started:

- **OpenAPI Schemas** - `examples/schemas/` contains sample OpenAPI schema files you can use as templates
- **Library Usage** - `examples/lib/` demonstrates how to use the MCP server as a module in your applications

You can use these examples as reference implementations for your own projects.

## License

ISC
