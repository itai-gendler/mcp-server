/**
 * Basic MCP Server Integration Example
 *
 * This example shows how to use the MCP server as a library
 * in another Node.js application with Zod for schema validation.
 */

// Import the MCP server module and Zod for schema validation
const mcpServer = require("../../../index");
const path = require("path");
const z = require("zod");

// Path to the example schemas
const schemasPath = path.resolve(__dirname, "../../schemas/basic");

/**
 * Main function to set up and run the server
 */
async function main() {
  console.log(`Starting MCP server with schemas from: ${schemasPath}`);

  try {
    // Start the server with your preferred transport type and configuration
    // This single call handles everything - creating the server and starting it with the specified transport
    const serverInstance = await mcpServer.launchServer(
      mcpServer.TransportType.SSE, // you can use STDIO, SSE, or STREAMABLE
      {
        // Specify custom OpenAPI directory
        openapiDir: schemasPath,

        // Configure server metadata
        serverConfig: {
          name: "Example MCP Server",
          version: "1.0.0",
        },

        // Configure API client options
        apiOptions: {
          timeout: 15000,
          headers: {
            // You can add default headers here
            "X-Custom-Header": "custom-value",
          },
        },

        // Define tools to register with the server - using array of argument arrays format with Zod schemas
        // Each array matches the parameters of server.tool() method
        tools: [
          // Simple tool with Zod schema: [name, schema, handler]
          [
            "calculate-bmi",
            // Define schema using Zod
            {
              weightKg: z.number(),
              heightM: z.number(),
            },
            async ({ weightKg, heightM }) => ({
              content: [
                {
                  type: "text",
                  text: String(weightKg / (heightM * heightM)),
                },
              ],
            }),
          ],

          // Tool with more complex Zod schema: [name, schema, handler]
          [
            "fetch-weather",
            { city: z.string() },
            async ({ city }) => {
              const response = await fetch(`https://api.weather.com/${city}`);
              const data = await response.text();
              return {
                content: [{ type: "text", text: data }],
              };
            },
          ],
        ],

        // Define resources to register with the server - using array of argument arrays format
        // Each array matches the parameters of server.resource() method: [name, uriPattern, handler]
        resources: [
          // Static resource: [name, uriPattern, handler]
          [
            "config",
            "config://app",
            async (uri) => ({
              contents: [
                {
                  uri: uri.href,
                  text: "App configuration here",
                },
              ],
            }),
          ],

          // Dynamic resource with parameters: [name, uriTemplate, handler]
          [
            "user-profile",
            "users://{userId}/profile",
            async (uri) => {
              const userId = uri.pathname.split("/")[1];
              return {
                contents: [
                  {
                    uri: uri.href,
                    text: `Profile data for user ${userId}`,
                  },
                ],
              };
            },
          ],
        ],
      }
    );

    // Other transport options (uncomment to use):
    //
    // Server-Sent Events (SSE) transport:
    // mcpServer.launchServer(mcpServer.TransportType.SSE, {
    //   openapiDir: schemasPath,
    //   port: 3000,           // Port to listen on (default: 3000)
    //   endpointPath: '/sse'  // SSE endpoint path (default: /sse)
    // });
    //
    // HTTP Streamable transport:
    // mcpServer.launchServer(mcpServer.TransportType.STREAMABLE, {
    //   openapiDir: schemasPath,
    //   port: 3000            // Port to listen on (default: 3000)
    // });

    console.log("MCP Server started successfully");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Run the server
main();
