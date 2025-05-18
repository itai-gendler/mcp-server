const SchemaUrlExtractor = require('../../src/schema-loader/schema-url-extractor');

describe('SchemaUrlExtractor', () => {
  test('should extract base URL from OpenAPI 3.0 schema', () => {
    const schema = {
      openapi: '3.0.0',
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.example.com/v1',
          description: 'Staging server'
        }
      ]
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBe('https://api.example.com/v1');
  });

  test('should extract base URL from Swagger 2.0 schema', () => {
    const schema = {
      swagger: '2.0',
      host: 'api.example.com',
      basePath: '/v1',
      schemes: ['https', 'http']
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBe('https://api.example.com/v1');
  });

  test('should use https as default scheme for Swagger 2.0 if not provided', () => {
    const schema = {
      swagger: '2.0',
      host: 'api.example.com',
      basePath: '/v1'
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBe('https://api.example.com/v1');
  });

  test('should handle empty basePath for Swagger 2.0', () => {
    const schema = {
      swagger: '2.0',
      host: 'api.example.com',
      schemes: ['https']
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBe('https://api.example.com');
  });

  test('should return null if schema is null or undefined', () => {
    expect(SchemaUrlExtractor.getBaseUrl(null)).toBeNull();
    expect(SchemaUrlExtractor.getBaseUrl(undefined)).toBeNull();
  });

  test('should return null if no server URL can be found', () => {
    const schema = {
      openapi: '3.0.0',
      servers: []
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBeNull();
  });

  test('should return null if no host is provided in Swagger 2.0', () => {
    const schema = {
      swagger: '2.0',
      basePath: '/v1'
    };
    
    const baseUrl = SchemaUrlExtractor.getBaseUrl(schema);
    expect(baseUrl).toBeNull();
  });
});
