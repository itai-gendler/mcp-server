# OpenAPI to MCP Converter

Converts OpenAPI schemas (2.0, 3.0, 3.1) to MCP tools and Zod schemas. Supports security policies for API authentication.

## Install

```bash
npm install
```

## Usage

```javascript
// Load from a single file
const converter = new OpenApiToMcp();
await converter.loadFromFile("openapi.yaml");

// Load from a directory (loads all .yaml and .yml files)
await converter.loadFromDirectory("openapi");

// Load from URL
await converter.loadFromUrl("https://example.com/api/openapi.yaml");

// Generate MCP tools
await converter.generateMcpServerTools(mcpServer);
```

## Security Policies

The converter supports extracting security policies from OpenAPI schemas and applying them to API requests. Currently, it supports `apiKey` type security schemes that are injected into request headers.

### OpenAPI Security Configuration

Define security schemes in your OpenAPI schema:

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer

# Global security policy - applies to all operations unless overridden
security:
  - ApiKeyAuth: []

paths:
  /api/resource:
    get:
      # This operation uses the global security policy
      ...
    post:
      # This operation overrides the global security policy
      security:
        - BearerAuth: []
      ...
```

### Environment Variables

Security tokens are automatically loaded from environment variables. The environment variable names are derived from the header names specified in the OpenAPI schema:

- Header `X-API-Key` → Environment variable `X_API_KEY`
- Header `Authorization` → Environment variable `AUTHORIZATION`

Example:

```bash
# Set environment variables for security tokens
export X_API_KEY=your-api-key
export AUTHORIZATION="Bearer your-token"
```

## Run

You can run the MCP server in three different modes:

### Standard Mode (stdio)

Run the MCP server using stdio transport:

```bash
npm start        # Run server using stdio (default)
# or
npm run start:stdio  # Same as above
```

### Streamable HTTP Mode

Run the MCP server using streamable HTTP transport:

```bash
npm run start:http  # Run server using HTTP
```

This will start an HTTP server on port 3000 (by default) with the following endpoints:

- `http://localhost:3000/health` - Health check endpoint
- `http://localhost:3000/mcp` - MCP endpoint for tool invocations

The streamable HTTP implementation uses a stateless approach, creating a new MCP server instance for each request. This ensures complete isolation between requests but may have higher latency for multiple requests.

### Server-Sent Events (SSE) Mode

Run the MCP server using Server-Sent Events (SSE) transport:

```bash
npm run start:sse  # Run server using SSE
```

This will start an HTTP server on port 3000 (by default) with the following endpoints:

- `http://localhost:3000/health` - Health check endpoint
- `http://localhost:3000/sse` - SSE endpoint for establishing the event stream connection
- `http://localhost:3000/messages` - Endpoint for sending messages to the server (requires sessionId parameter)

### Customizing Server Settings

You can customize the port and host for both HTTP modes by setting environment variables:

```bash
PORT=8080 HOST=0.0.0.0 npm run start:http  # For streamable HTTP
# or
PORT=8080 HOST=0.0.0.0 npm run start:sse   # For SSE
```

## License

ISC
