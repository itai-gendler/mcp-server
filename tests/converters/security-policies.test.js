const path = require('path');
const { loadOpenApiFromFile } = require('../../src/utils/openapi-loader');
const OpenApi3Converter = require('../../src/converters/openapi3-converter');

describe('Security Policies in OpenAPI Converter', () => {
  let schema;
  let converter;
  
  beforeAll(async () => {
    // Load the test fixture schema with security policies
    const filePath = path.resolve(__dirname, '../fixtures/openapi-with-security.yaml');
    schema = await loadOpenApiFromFile(filePath);
    converter = new OpenApi3Converter(schema);
  });
  
  test('should include security requirements in generated MCP tools', () => {
    // Convert schema to MCP tools
    const tools = converter.convertToMcpTools();
    
    // Verify that tools were generated
    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    
    // Find the GET /api/person/{idOrName} operation
    const getPersonTool = tools.find(tool => 
      tool.method === 'get' && tool.path === '/api/person/{idOrName}'
    );
    
    // Verify that it has no security policy (as defined in openapi-2.yaml)
    expect(getPersonTool).toBeDefined();
    expect(getPersonTool.security).toBeDefined();
    expect(getPersonTool.security).toEqual([]);
    
    // Find the POST /api/person/ operation
    const postPersonTool = tools.find(tool => 
      tool.method === 'post' && tool.path === '/api/person'
    );
    
    // Verify that it has the cookie auth security policy
    expect(postPersonTool).toBeDefined();
    expect(postPersonTool.security).toBeDefined();
    expect(postPersonTool.security).toEqual([{ cookieAuth: [] }]);
    
    // Find the GET /api/person/search operation
    const searchPersonTool = tools.find(tool => 
      tool.method === 'get' && tool.path === '/api/person/search'
    );
    
    // Verify that it has both apiKey and bearer security policies
    expect(searchPersonTool).toBeDefined();
    expect(searchPersonTool.security).toBeDefined();
    expect(searchPersonTool.security).toEqual([{ apiKeyAuth: [] }, { bearerAuth: [] }]);
  });
});
