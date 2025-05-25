/**
 * Basic MCP Server Integration Example
 *
 * This example shows how to use the MCP server as a library
 * in another Node.js application with Zod for schema validation.
 */

// Import the MCP server module and Zod for schema validation
const mcpServer = require("../../../index");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const z = require("zod");

// Path to the example schemas
const schemasPath = path.resolve(__dirname, "../../schemas/huawei");

// Path to the resources directory (local to this example)
const resourcesPath = path.resolve(__dirname, "./resources");

/**
 * Read and parse all YAML files from the resources directory and its subdirectories
 * @returns {Array<{type: string, name: string, content: object}>} Array of resource objects
 */
function loadResources() {
  const resources = [];

  try {
    // Check if resources directory exists
    if (!fs.existsSync(resourcesPath)) {
      console.warn(`Resources directory does not exist: ${resourcesPath}`);
      return [];
    }

    // Get all subdirectories in the resources directory
    const resourceTypes = fs
      .readdirSync(resourcesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Process each resource type directory
    for (const resourceType of resourceTypes) {
      const typePath = path.join(resourcesPath, resourceType);

      // Read all files in the resource type directory
      const files = fs.readdirSync(typePath);

      // Process each YAML file
      for (const file of files) {
        if (file.endsWith(".yaml") || file.endsWith(".yml")) {
          const filePath = path.join(typePath, file);
          const content = fs.readFileSync(filePath, "utf8");

          try {
            // Parse YAML content
            const resourceData = yaml.load(content);

            // Extract resource name from file name (without extension)
            const resourceName = file.replace(/\.ya?ml$/, "");

            resources.push({
              type: resourceType,
              name: resourceName,
              content: resourceData,
            });

            console.log(
              `Loaded resource: ${resourceType}/${resourceName} from ${file}`
            );
          } catch (parseError) {
            console.error(`Error parsing YAML file ${filePath}:`, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error loading resources:", error);
  }

  return resources;
}

/**
 * Main function to set up and run the server
 */
async function main() {
  console.log(`Starting MCP server with schemas from: ${schemasPath}`);

  // Load resources from the resources directory
  const resources = loadResources();
  console.log(`Loaded ${resources.length} resources`);

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
          // [
          //   "calculate-bmi",
          //   // Define schema using Zod
          //   {
          //     weightKg: z.number(),
          //     heightM: z.number(),
          //   },
          //   async ({ weightKg, heightM }) => ({
          //     content: [
          //       {
          //         type: "text",
          //         text: String(weightKg / (heightM * heightM)),
          //       },
          //     ],
          //   }),
          // ],
          // // Tool with more complex Zod schema: [name, schema, handler]
          // [
          //   "fetch-weather",
          //   { city: z.string() },
          //   async ({ city }) => {
          //     const response = await fetch(`https://api.weather.com/${city}`);
          //     const data = await response.text();
          //     return {
          //       content: [{ type: "text", text: data }],
          //     };
          //   },
          // ],
        ],

        // Define resources to register with the server - using array of argument arrays format
        // Each array matches the parameters of server.resource() method: [name, uriPattern, handler]
        resources: [
          // Static resource: [name, uriPattern, handler]
          // [
          //   "entities",
          //   "entities://environment",
          //   async (uri) => ({
          //     contents: [
          //       {
          //         uri: uri.href,
          //         text: "App configuration here",
          //       },
          //     ],
          //   }),
          // ],

          // // Dynamic resource with parameters: [name, uriTemplate, handler]
          // [
          //   "user-profile",
          //   "users://{userId}/profile",
          //   async (uri) => {
          //     const userId = uri.pathname.split("/")[1];
          //     return {
          //       contents: [
          //         {
          //           uri: uri.href,
          //           text: `Profile data for user ${userId}`,
          //         },
          //       ],
          //     };
          //   },
          // ],

          // Dynamic resources from the resources directory
          ...resources.map((resource) => [
            `${resource.type}-${resource.name}`,
            `${resource.type}://${resource.name}`,
            async (uri) => ({
              contents: [
                {
                  uri: uri.href,
                  // Return the resource content as a formatted JSON string
                  text: JSON.stringify(resource.content, null, 2),
                },
              ],
            }),
          ]),
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
