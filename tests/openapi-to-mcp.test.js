const path = require('path');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const OpenApiToMcp = require('../src/openapi-to-mcp');

describe('OpenApiToMcp', () => {
  let converter;
  const openApiFilePath = path.resolve(__dirname, '../openapi.yaml');

  beforeEach(() => {
    converter = new OpenApiToMcp();
  });

  describe('loadFromFile', () => {
    test('should load OpenAPI schema from file', async () => {
      await converter.loadFromFile(openApiFilePath);
      expect(converter.schema).toBeDefined();
      expect(converter.converter).toBeDefined();
    });

    test('should throw error for invalid file path', async () => {
      await expect(converter.loadFromFile('invalid-path.yaml')).rejects.toThrow();
    });
  });

  describe('loadFromObject', () => {
    test('should load OpenAPI schema from object', () => {
      const schema = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} };
      converter.loadFromObject(schema);
      expect(converter.schema).toBe(schema);
      expect(converter.converter).toBeDefined();
    });
  });

  describe('convertToMcpTools', () => {
    test('should convert OpenAPI schema to MCP tools', async () => {
      await converter.loadFromFile(openApiFilePath);
      const tools = converter.convertToMcpTools();
      
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    test('should throw error if no schema is loaded', () => {
      expect(() => converter.convertToMcpTools()).toThrow('No OpenAPI schema loaded');
    });
  });

  describe('convertToZodSchemas', () => {
    test('should convert OpenAPI schema to Zod schemas', async () => {
      await converter.loadFromFile(openApiFilePath);
      const schemas = converter.convertToZodSchemas();
      
      expect(schemas).toBeDefined();
      expect(Object.keys(schemas).length).toBeGreaterThan(0);
    });

    test('should throw error if no schema is loaded', () => {
      expect(() => converter.convertToZodSchemas()).toThrow('No OpenAPI schema loaded');
    });
  });

  describe('generateMcpServerTools', () => {
    test('should register tools with MCP server', async () => {
      // Create a mock MCP server
      const server = {
        tool: jest.fn()
      };

      await converter.loadFromFile(openApiFilePath);
      await converter.generateMcpServerTools(server, {
        baseUrl: 'http://test-api.example.com'
      });
      
      // Verify that tool was called for each API endpoint
      expect(server.tool).toHaveBeenCalled();
      expect(server.tool.mock.calls.length).toBeGreaterThan(0);
    });
    
    test('should use base URL from schema if not provided in options', async () => {
      // Create a mock MCP server
      const server = {
        tool: jest.fn()
      };
      
      // Spy on getBaseUrlFromSchema
      const spy = jest.spyOn(OpenApiToMcp.prototype, 'getBaseUrlFromSchema');
      spy.mockReturnValue('http://schema-url.example.com');

      await converter.loadFromFile(openApiFilePath);
      await converter.generateMcpServerTools(server);
      
      expect(spy).toHaveBeenCalled();
      
      // Restore the original method
      spy.mockRestore();
    });

    test('should throw error if no schema is loaded', async () => {
      const server = { tool: jest.fn() };
      await expect(converter.generateMcpServerTools(server)).rejects.toThrow('No OpenAPI schema loaded');
    });
  });
});
