const AxiosApiClient = require("../api-client/axios-client");

/**
 * Generates MCP tools from OpenAPI endpoints
 */
class McpToolGenerator {
  /**
   * Create a new MCP tool generator
   * @param {object} options - Generator options
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Generate MCP tools from OpenAPI endpoints
   * @param {McpServer} server - MCP server instance
   * @param {Array<object>} tools - Array of tool definitions
   * @param {object} apiOptions - API client options
   */
  generateTools(server, tools, apiOptions = {}) {
    // Create API client
    const apiClient = new AxiosApiClient({
      baseUrl: apiOptions.baseUrl || "",
      headers: apiOptions.headers || {},
      timeout: apiOptions.timeout || 30000,
    });

    // Register each tool with the MCP server
    for (const tool of tools) {
      const { name, description, parameters, method, path, summary, title } =
        tool;

      // Create tool annotations with title from OpenAPI
      const annotations = {
        title: title || summary || description,
      };

      // Register the tool with the MCP server
      server.tool(
        name,
        parameters,
        annotations,
        async (params) => {
          try {
            // Process parameters
            const { pathParams, queryParams, bodyParams } =
              apiClient.processParameters(params, path, method);

            // Make the API call
            const response = await apiClient.request({
              method,
              path,
              pathParams,
              queryParams,
              bodyParams,
            });

            // Return the response data
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            // Handle API call errors
            const errorMessage = `Error: ${error.message}\n${JSON.stringify(
              error.data || {},
              null,
              2
            )}`;

            return {
              content: [
                {
                  type: "text",
                  text: errorMessage,
                },
              ],
            };
          }
        },
        { description }
      );
    }
  }
}

module.exports = McpToolGenerator;
