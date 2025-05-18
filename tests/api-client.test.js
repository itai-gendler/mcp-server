const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const axios = require("axios");
const OpenApiToMcp = require("../src/openapi-to-mcp");
const path = require("path");

// Mock axios
jest.mock("axios");

describe("API Client Integration", () => {
  let converter;
  let server;
  const openApiFilePath = path.resolve(__dirname, "./fixtures/openapi-single.yaml");

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock MCP server
    server = {
      tool: jest.fn(),
    };

    // Create a new converter
    converter = new OpenApiToMcp();
  });

  test("should make API calls with correct parameters", async () => {
    // Setup
    await converter.loadFromFile(openApiFilePath);

    // Mock axios response
    axios.mockResolvedValue({
      data: { result: "success" },
      status: 200,
      statusText: "OK",
    });

    // Generate MCP tools with a base URL
    await converter.generateMcpServerTools(server, {
      baseUrl: "http://api.example.com",
    });

    // Verify that tools were registered
    expect(server.tool).toHaveBeenCalled();

    // Get the first registered tool's callback function
    const firstToolCallback = server.tool.mock.calls[0][3];

    // Call the tool with some parameters
    const result = await firstToolCallback({ id: "123" });

    // Verify that axios was called with the correct parameters
    expect(axios).toHaveBeenCalled();
    const axiosCallConfig = axios.mock.calls[0][0];

    // Check URL construction
    expect(axiosCallConfig.url).toContain("http://api.example.com");

    // Check that the response was formatted correctly
    expect(result).toHaveProperty("content");
    expect(result.content[0]).toHaveProperty("type", "text");
    expect(result.content[0].text).toContain("success");
  });

  test("should handle API errors correctly", async () => {
    // Setup
    await converter.loadFromFile(openApiFilePath);

    // Mock axios error response
    const errorResponse = {
      response: {
        status: 404,
        statusText: "Not Found",
        data: { error: "Resource not found" },
      },
    };
    axios.mockRejectedValue(errorResponse);

    // Generate MCP tools with a base URL
    await converter.generateMcpServerTools(server, {
      baseUrl: "http://api.example.com",
    });

    // Get the first registered tool's callback function
    const firstToolCallback = server.tool.mock.calls[0][3];

    // Call the tool with some parameters
    const result = await firstToolCallback({ id: "123" });

    // Verify error handling
    expect(result).toHaveProperty("content");
    expect(result.content[0]).toHaveProperty("type", "text");
    expect(result.content[0].text).toContain("Error:");
    expect(result.content[0].text).toContain("API Error: 404");
    expect(result.content[0].text).toContain("Resource not found");
  });

  test("should extract path, query, and body parameters correctly", async () => {
    // Setup
    await converter.loadFromFile(openApiFilePath);

    // Mock axios response
    axios.mockResolvedValue({
      data: { result: "success" },
      status: 200,
      statusText: "OK",
    });

    // Generate MCP tools with a base URL
    await converter.generateMcpServerTools(server, {
      baseUrl: "http://api.example.com",
    });

    // Find a tool with a path parameter (e.g., /api/queue/{idOrName})
    const queueToolIndex = server.tool.mock.calls.findIndex(
      (call) => call[0].includes("queue") && call[0].includes("idOrName")
    );

    if (queueToolIndex !== -1) {
      const queueToolCallback = server.tool.mock.calls[queueToolIndex][3];

      // Call the tool with path parameter
      await queueToolCallback({ idOrName: "test-queue", limit: 10 });

      // Verify axios was called with correctly processed parameters
      const axiosCallConfig = axios.mock.calls[0][0];

      // Check that path parameter was replaced in URL
      expect(axiosCallConfig.url).toContain("test-queue");

      // For GET requests, non-path params should be in query
      if (axiosCallConfig.method === "get") {
        expect(axiosCallConfig.params).toHaveProperty("limit", 10);
      }
    } else {
      // If we can't find a specific tool, just verify a general POST call
      const postToolIndex = server.tool.mock.calls.findIndex((call) =>
        call[0].includes("post")
      );

      if (postToolIndex !== -1) {
        const postToolCallback = server.tool.mock.calls[postToolIndex][3];

        // Call the tool with body parameters
        await postToolCallback({
          name: "test",
          description: "test description",
        });

        // Verify axios was called with correctly processed parameters
        const axiosCallConfig = axios.mock.calls[0][0];

        // For POST requests, non-path params should be in body
        expect(axiosCallConfig.data).toBeDefined();
        if (axiosCallConfig.data) {
          expect(axiosCallConfig.data).toHaveProperty("name", "test");
          expect(axiosCallConfig.data).toHaveProperty(
            "description",
            "test description"
          );
        }
      }
    }
  });

  test("should get base URL from OpenAPI schema", async () => {
    // Setup
    await converter.loadFromFile(openApiFilePath);

    // Test the getBaseUrlFromSchema method
    const baseUrl = converter.getBaseUrlFromSchema();

    // Our sample OpenAPI has a server URL
    expect(baseUrl).toBeDefined();
    expect(baseUrl).toContain("localhost");
  });
});
