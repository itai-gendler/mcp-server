const path = require('path');
const { loadOpenApiFromFile, detectOpenApiVersion } = require('../../src/utils/openapi-loader');

describe('OpenAPI Loader', () => {
  describe('detectOpenApiVersion', () => {
    test('should detect OpenAPI 2.0 (Swagger)', () => {
      const schema = { swagger: '2.0' };
      expect(detectOpenApiVersion(schema)).toBe('2.0');
    });

    test('should detect OpenAPI 3.0', () => {
      const schema = { openapi: '3.0.0' };
      expect(detectOpenApiVersion(schema)).toBe('3.0');
    });

    test('should detect OpenAPI 3.1', () => {
      const schema = { openapi: '3.1.0' };
      expect(detectOpenApiVersion(schema)).toBe('3.1');
    });

    test('should throw error for unsupported version', () => {
      const schema = { version: '1.0' };
      expect(() => detectOpenApiVersion(schema)).toThrow('Unsupported or undetected OpenAPI version');
    });
  });

  describe('loadOpenApiFromFile', () => {
    test('should load and validate OpenAPI YAML file', async () => {
      const filePath = path.resolve(__dirname, '../../openapi.yaml');
      const schema = await loadOpenApiFromFile(filePath);
      
      expect(schema).toBeDefined();
      expect(schema.openapi).toBe('3.0.0');
      expect(schema.info.title).toBe('Kastro API');
    });

    test('should throw error for non-existent file', async () => {
      const filePath = path.resolve(__dirname, '../../non-existent.yaml');
      await expect(loadOpenApiFromFile(filePath)).rejects.toThrow('Failed to load OpenAPI schema');
    });
  });
});
