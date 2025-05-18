const path = require('path');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const OpenApiToMcp = require('../src/openapi-to-mcp');
const SchemaUrlExtractor = require('../src/schema-loader/schema-url-extractor');

describe('OpenApiToMcp', () => {
  let converter;
  const openApiFilePath = path.resolve(__dirname, './fixtures/openapi-single.yaml');
  const openApiDirPath = path.resolve(__dirname, './fixtures/openapi-dir');

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

  describe('loadFromDirectory', () => {
    test('should load OpenAPI schemas from directory', async () => {
      await converter.loadFromDirectory(openApiDirPath);
      
      expect(converter.schemas).toBeDefined();
      expect(Array.isArray(converter.schemas)).toBe(true);
      expect(converter.schemas.length).toBe(2); // We have two test files
      
      expect(converter.converters).toBeDefined();
      expect(Array.isArray(converter.converters)).toBe(true);
      expect(converter.converters.length).toBe(2);
      
      // Check that each schema has the expected structure
      converter.schemas.forEach(item => {
        expect(item).toHaveProperty('filePath');
        expect(item).toHaveProperty('schema');
        expect(item.schema).toHaveProperty('openapi', '3.0.0');
        expect(item.schema).toHaveProperty('info');
        expect(item.schema.info).toHaveProperty('title');
        expect(['Test API 1', 'Test API 2']).toContain(item.schema.info.title);
      });
    });

    test('should throw error for invalid directory path', async () => {
      await expect(converter.loadFromDirectory('./non-existent-dir')).rejects.toThrow();
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
    test('should register tools with MCP server for single schema', async () => {
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
    
    test('should register tools with MCP server for multiple schemas', async () => {
      // Create a mock MCP server
      const server = {
        tool: jest.fn()
      };
      
      await converter.loadFromDirectory(openApiDirPath);
      await converter.generateMcpServerTools(server);
      
      // Verify that tool was called for each API endpoint from both schemas
      expect(server.tool).toHaveBeenCalled();
      expect(server.tool.mock.calls.length).toBeGreaterThan(1); // Should have at least 2 calls (one for each API)
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

    test('should extract base URLs from schemas', async () => {
      // Create a spy on SchemaUrlExtractor.getBaseUrl
      const spy = jest.spyOn(SchemaUrlExtractor, 'getBaseUrl');
      
      // Create a mock MCP server
      const server = {
        tool: jest.fn()
      };
      
      await converter.loadFromDirectory(openApiDirPath);
      await converter.generateMcpServerTools(server);
      
      // Should have called getBaseUrl at least twice (once for each schema)
      expect(spy).toHaveBeenCalledTimes(2);
      
      // Restore the spy
      spy.mockRestore();
    });

    test('should throw error if no schema is loaded', async () => {
      const server = { tool: jest.fn() };
      await expect(converter.generateMcpServerTools(server)).rejects.toThrow('No OpenAPI schema loaded');
    });
  });
});
