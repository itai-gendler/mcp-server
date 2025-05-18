const path = require('path');
const { loadOpenApiFromFile } = require('../../src/utils/openapi-loader');
const OpenApi3Converter = require('../../src/converters/openapi3-converter');
const { z } = require('zod');

describe('OpenAPI 3.0 Converter', () => {
  let schema;
  let converter;

  beforeAll(async () => {
    const filePath = path.resolve(__dirname, '../../openapi.yaml');
    schema = await loadOpenApiFromFile(filePath);
    converter = new OpenApi3Converter(schema);
  });

  describe('convertToMcpTools', () => {
    test('should convert OpenAPI paths to MCP tools', () => {
      const tools = converter.convertToMcpTools();
      
      // Check that we have tools
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check structure of a tool
      const tool = tools[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('parameters');
      expect(tool).toHaveProperty('method');
      expect(tool).toHaveProperty('path');
      
      // Verify a specific endpoint from our sample OpenAPI
      const configGetTool = tools.find(t => t.path === '/api/config/activated' && t.method === 'get');
      expect(configGetTool).toBeDefined();
      expect(configGetTool.name).toBe('get_api_config_activated');
      expect(configGetTool.description).toBe('Get the active Config configuration');
    });
  });

  describe('convertParameterToZod', () => {
    test('should convert string parameter to Zod schema', () => {
      const param = {
        name: 'testString',
        schema: {
          type: 'string',
          minLength: 3,
          maxLength: 10
        },
        required: true
      };
      
      const zodSchema = converter.convertParameterToZod(param);
      expect(zodSchema).toBeDefined();
      
      // Test validation
      expect(() => zodSchema.parse('abc')).not.toThrow();
      expect(() => zodSchema.parse('abcdefghij')).not.toThrow();
      expect(() => zodSchema.parse('ab')).toThrow();
      expect(() => zodSchema.parse('abcdefghijk')).toThrow();
    });
    
    test('should convert number parameter to Zod schema', () => {
      const param = {
        name: 'testNumber',
        schema: {
          type: 'number',
          minimum: 1,
          maximum: 100
        },
        required: true
      };
      
      const zodSchema = converter.convertParameterToZod(param);
      expect(zodSchema).toBeDefined();
      
      // Test validation
      expect(() => zodSchema.parse(1)).not.toThrow();
      expect(() => zodSchema.parse(50)).not.toThrow();
      expect(() => zodSchema.parse(100)).not.toThrow();
      expect(() => zodSchema.parse(0)).toThrow();
      expect(() => zodSchema.parse(101)).toThrow();
    });
    
    test('should convert enum parameter to Zod schema', () => {
      const param = {
        name: 'testEnum',
        schema: {
          type: 'string',
          enum: ['one', 'two', 'three']
        },
        required: true
      };
      
      const zodSchema = converter.convertParameterToZod(param);
      expect(zodSchema).toBeDefined();
      
      // Test validation
      expect(() => zodSchema.parse('one')).not.toThrow();
      expect(() => zodSchema.parse('two')).not.toThrow();
      expect(() => zodSchema.parse('three')).not.toThrow();
      expect(() => zodSchema.parse('four')).toThrow();
    });
    
    test('should handle optional parameters', () => {
      const param = {
        name: 'testOptional',
        schema: {
          type: 'string'
        },
        required: false
      };
      
      const zodSchema = converter.convertParameterToZod(param);
      expect(zodSchema).toBeDefined();
      
      // Test validation
      expect(() => zodSchema.parse('test')).not.toThrow();
      expect(() => zodSchema.parse(undefined)).not.toThrow();
    });
  });

  describe('convertToZodSchemas', () => {
    test('should convert OpenAPI schemas to Zod schemas', () => {
      const zodSchemas = converter.convertToZodSchemas();
      
      expect(zodSchemas).toBeDefined();
      expect(Object.keys(zodSchemas).length).toBeGreaterThan(0);
      
      // Check for specific schema from our sample OpenAPI
      expect(zodSchemas).toHaveProperty('Config');
      expect(zodSchemas).toHaveProperty('ConfigInput');
    });
  });
});
