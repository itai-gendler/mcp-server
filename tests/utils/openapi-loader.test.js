const path = require('path');
const fs = require('fs');
const { loadOpenApiFromFile, loadOpenApiFromDirectory, detectOpenApiVersion } = require('../../src/utils/openapi-loader');

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
      const filePath = path.resolve(__dirname, '../fixtures/openapi-single.yaml');
      const schema = await loadOpenApiFromFile(filePath);
      
      expect(schema).toBeDefined();
      expect(schema.openapi).toBe('3.0.0');
      expect(schema.info.title).toBe('Test API');
    });

    test('should throw error for non-existent file', async () => {
      const filePath = path.resolve(__dirname, '../../non-existent.yaml');
      await expect(loadOpenApiFromFile(filePath)).rejects.toThrow('Failed to load OpenAPI schema');
    });
  });

  describe('loadOpenApiFromDirectory', () => {
    const fixturesDir = path.resolve(__dirname, '../fixtures/openapi-dir');
    
    test('should load and validate all OpenAPI YAML files from directory', async () => {
      const schemas = await loadOpenApiFromDirectory(fixturesDir);
      
      expect(schemas).toBeDefined();
      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas.length).toBe(2); // We have two test files in the fixtures directory
      
      // Check that each schema has the expected structure
      schemas.forEach(item => {
        expect(item).toHaveProperty('filePath');
        expect(item).toHaveProperty('schema');
        expect(item.schema).toHaveProperty('openapi', '3.0.0');
        expect(item.schema).toHaveProperty('info');
        expect(item.schema.info).toHaveProperty('title');
        expect(['Test API 1', 'Test API 2']).toContain(item.schema.info.title);
      });
      
      // Check that we have both API schemas
      const titles = schemas.map(item => item.schema.info.title);
      expect(titles).toContain('Test API 1');
      expect(titles).toContain('Test API 2');
    });
    
    test('should throw error for non-existent directory', async () => {
      const dirPath = path.resolve(__dirname, '../fixtures/non-existent-dir');
      await expect(loadOpenApiFromDirectory(dirPath)).rejects.toThrow('Directory does not exist');
    });
    
    test('should throw error for directory with no YAML files', async () => {
      // Create an empty temp directory
      const emptyDir = path.resolve(__dirname, '../fixtures/empty-dir');
      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }
      
      await expect(loadOpenApiFromDirectory(emptyDir)).rejects.toThrow('No YAML files found');
    });
  });
});
