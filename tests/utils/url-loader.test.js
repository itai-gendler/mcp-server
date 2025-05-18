const { loadOpenApiFromUrl } = require('../../src/utils/openapi-loader');
const nock = require('nock');

describe('URL OpenAPI Loader', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  test('should load OpenAPI schema from URL - JSON', async () => {
    // Mock schema to be returned
    const mockSchema = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {}
    };
    
    // Setup nock to intercept the HTTP request
    const baseUrl = 'https://example.com';
    const path = '/api/openapi.json';
    
    nock(baseUrl)
      .get(path)
      .reply(200, mockSchema);
    
    // Test the URL loader
    const schema = await loadOpenApiFromUrl(`${baseUrl}${path}`);
    
    // Verify the result
    expect(schema).toBeDefined();
    expect(schema.openapi).toBe('3.0.0');
    expect(schema.info.title).toBe('Test API');
  });

  test('should load OpenAPI schema from URL - YAML', async () => {
    // Mock YAML content
    const yamlContent = `
openapi: 3.0.0
info:
  title: Test YAML API
  version: 1.0.0
paths: {}
`;
    
    // Setup nock to intercept the HTTP request
    const baseUrl = 'https://example.com';
    const path = '/api/openapi.yaml';
    
    nock(baseUrl)
      .get(path)
      .reply(200, yamlContent);
    
    // Test the URL loader
    const schema = await loadOpenApiFromUrl(`${baseUrl}${path}`);
    
    // Verify the result
    expect(schema).toBeDefined();
    expect(schema.openapi).toBe('3.0.0');
    expect(schema.info.title).toBe('Test YAML API');
  });

  test('should handle HTTP errors', async () => {
    // Setup nock to return an error
    const baseUrl = 'https://example.com';
    const path = '/api/not-found';
    
    nock(baseUrl)
      .get(path)
      .reply(404);
    
    // Test error handling
    await expect(loadOpenApiFromUrl(`${baseUrl}${path}`)).rejects.toThrow('Failed to load OpenAPI schema from URL');
  });
});
