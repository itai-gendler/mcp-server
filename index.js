/**
 * MCP Server Launcher and Module
 *
 * This script can be used in two ways:
 * 1. As a module: require it and extend with custom tools and resources
 * 2. As a CLI tool: direct execution with command line arguments
 *
 * CLI Usage:
 *   node index.js <transport> [--openapi-dir <path>]
 *
 * Where:
 *   - transport: stdio, sse, or streamable
 *   - --openapi-dir: Optional path to directory containing OpenAPI YAML files
 *     (defaults to ./openapi if not specified)
 */

const path = require("path");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const OpenApiToMcp = require("./src/openapi-to-mcp");

// Import the transport implementations
const stdioTransport = require("./src/entry/stdio");
const sseTransport = require("./src/entry/sse-server");
const streamableTransport = require("./src/entry/http-server");

/**
 * Enum for valid transport types
 * @enum {string}
 */
const TransportType = {
  /** Standard input/output transport */
  STDIO: "stdio",
  /** Server-Sent Events transport */
  SSE: "sse",
  /** HTTP Streamable transport */
  STREAMABLE: "streamable",
};

// Array of valid transport values
const VALID_TRANSPORTS = Object.values(TransportType);

// Import centralized argument parser
const { parseArgs: parseArgsUtil } = require("./src/utils/arg-parser");

/**
 * Parse command line arguments with validation for transport type
 * @returns {object} Object containing parsed args
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = parseArgsUtil(args, {
    openapiDir: path.resolve(__dirname, "openapi"),
  });

  if (args.length === 0) {
    console.error(
      `Error: Transport type is required.\nUsage: node index.js <transport> [--openapi-dir <path>]\nValid transports: ${VALID_TRANSPORTS.join(
        ", "
      )}`
    );
    process.exit(1);
  }

  if (!VALID_TRANSPORTS.includes(parsedArgs.transportType)) {
    console.error(
      `Error: Invalid transport type '${
        parsedArgs.transportType
      }'.\nValid transports: ${VALID_TRANSPORTS.join(", ")}`
    );
    process.exit(1);
  }

  return parsedArgs;
}

/**
 * Get the transport module for the specified transport type
 * @param {string} transportType - The transport type
 * @returns {object} The transport module with createServer and startServer functions
 */
function getTransportModule(transportType) {
  switch (transportType) {
    case TransportType.STDIO:
      return stdioTransport;
    case TransportType.SSE:
      return sseTransport;
    case TransportType.STREAMABLE:
      return streamableTransport;
    default:
      // This should never happen due to validation in parseArgs
      console.error(`Error: Unsupported transport type: ${transportType}`);
      process.exit(1);
  }
}

/**
 * Launch the MCP server with the specified transport type
 *
 * This is the main entry point for both CLI and library usage.
 *
 * @param {string} transportType - The transport type (from TransportType enum)
 * @param {object} options - Server configuration options
 * @param {string} options.openapiDir - Path to OpenAPI directory (default: ./openapi)
 * @param {object} options.serverConfig - MCP server configuration
 * @param {object} options.apiOptions - API client options
 * @param {array} options.tools - Array of tool definitions to register
 * @param {array} options.resources - Array of resource definitions to register
 * @param {array} options.prompts - Array of prompt definitions to register
 * @param {number} options.port - Port number for HTTP transports (default: 3000)
 * @param {string} options.host - Host for HTTP transports (default: localhost)
 * @returns {Promise<object>} - Server instance with appropriate transport
 */
async function launchServer(transportType, options = {}) {
  try {
    console.log(`Starting MCP server with ${transportType} transport...`);

    // First create the MCP server with OpenAPI tools (all transports use this)
    const { server } = await _createServer(options);

    // Register any tools if provided
    if (options.tools && Array.isArray(options.tools)) {
      for (const toolArgs of options.tools) {
        server.tool(...toolArgs);
      }
    }

    // Register any resources if provided
    if (options.resources && Array.isArray(options.resources)) {
      for (const resourceArgs of options.resources) {
        server.resource(...resourceArgs);
      }
    }

    // Get the appropriate transport module
    const transportModule = getTransportModule(transportType);

    // Start the server with the provided options and the pre-configured server
    const serverInstance = await transportModule.startServer({
      ...options,
      server, // Pass the pre-configured server to the transport
    });

    // Add a cleanup handler if we're running as the main module
    if (require.main === module) {
      // Setup graceful shutdown for CLI mode
      process.on("SIGINT", async () => {
        console.log("Shutting down...");
        try {
          if (serverInstance.stop) {
            await serverInstance.stop();
          }
          console.log("Server shutdown complete");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      process.on("SIGTERM", async () => {
        console.log("Received SIGTERM, shutting down...");
        try {
          if (serverInstance.stop) {
            await serverInstance.stop();
          }
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
    }

    return serverInstance;
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Create a configured MCP server with OpenAPI tools
 * This is an internal function used by launchServer
 * @private
 * @param {object} options - Configuration options
 * @param {string} options.openapiDir - Path to OpenAPI directory (default: ./openapi)
 * @param {object} options.serverConfig - MCP server configuration
 * @param {object} options.apiOptions - API client options
 * @returns {Promise<object>} Object containing server and converter instances
 */
async function _createServer(options = {}) {
  const {
    openapiDir = path.resolve(__dirname, "openapi"),
    serverConfig = {},
    apiOptions = {},
  } = options;

  // Create server with provided or default config
  const server = new McpServer({
    name: "OpenAPI MCP Server",
    version: "1.0.0",
    ...serverConfig,
  });

  // Create converter
  const converter = new OpenApiToMcp();

  // Load OpenAPI schemas
  if (openapiDir) {
    await converter.loadFromDirectory(openapiDir);
    await converter.generateMcpServerTools(server, apiOptions);
  }

  return { server, converter };
}

// Export module functionality for library usage
module.exports = {
  // Primary API: Single function to launch the server in any mode
  launchServer,

  // Export the enum for users to reference transport types
  TransportType,
};

// Execute as CLI if this file is run directly
if (require.main === module) {
  const { transportType, openapiDir } = parseArgs();
  launchServer(transportType, { openapiDir }).catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
