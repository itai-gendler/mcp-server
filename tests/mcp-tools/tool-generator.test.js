const McpToolGenerator = require('../../src/mcp-tools/tool-generator');
const AxiosApiClient = require('../../src/api-client/axios-client');

// Mock AxiosApiClient
jest.mock('../../src/api-client/axios-client');

describe('McpToolGenerator', () => {
  let generator;
  let mockServer;
  let mockApiClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock server
    mockServer = {
      tool: jest.fn()
    };
    
    // Create mock API client
    mockApiClient = {
      processParameters: jest.fn(),
      request: jest.fn()
    };
    
    // Mock AxiosApiClient constructor
    AxiosApiClient.mockImplementation(() => mockApiClient);
    
    // Create generator
    generator = new McpToolGenerator();
  });

  test('should register tools with MCP server', () => {
    // Sample tools
    const tools = [
      {
        name: 'get_users',
        description: 'Get all users',
        parameters: { limit: 'number', offset: 'number' },
        method: 'get',
        path: '/users'
      },
      {
        name: 'create_user',
        description: 'Create a new user',
        parameters: { name: 'string', email: 'string' },
        method: 'post',
        path: '/users'
      }
    ];
    
    // Generate tools
    generator.generateTools(mockServer, tools, {
      baseUrl: 'http://api.example.com'
    });
    
    // Verify tools were registered
    expect(mockServer.tool).toHaveBeenCalledTimes(2);
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_users',
      { limit: 'number', offset: 'number' },
      expect.any(Function),
      { description: 'Get all users' }
    );
    expect(mockServer.tool).toHaveBeenCalledWith(
      'create_user',
      { name: 'string', email: 'string' },
      expect.any(Function),
      { description: 'Create a new user' }
    );
  });

  test('should make API requests when tool is called', async () => {
    // Sample tool
    const tools = [
      {
        name: 'get_user',
        description: 'Get user by ID',
        parameters: { userId: 'string' },
        method: 'get',
        path: '/users/{userId}'
      }
    ];
    
    // Mock processParameters
    mockApiClient.processParameters.mockReturnValue({
      pathParams: { userId: '123' },
      queryParams: {},
      bodyParams: {}
    });
    
    // Mock request
    mockApiClient.request.mockResolvedValue({
      data: { id: '123', name: 'Test User' },
      status: 200
    });
    
    // Generate tools
    generator.generateTools(mockServer, tools, {
      baseUrl: 'http://api.example.com'
    });
    
    // Get the callback function
    const callback = mockServer.tool.mock.calls[0][2];
    
    // Call the tool
    const result = await callback({ userId: '123' });
    
    // Verify API client was used correctly
    expect(mockApiClient.processParameters).toHaveBeenCalledWith(
      { userId: '123' },
      '/users/{userId}',
      'get'
    );
    
    expect(mockApiClient.request).toHaveBeenCalledWith({
      method: 'get',
      path: '/users/{userId}',
      pathParams: { userId: '123' },
      queryParams: {},
      bodyParams: {}
    });
    
    // Verify result
    expect(result).toHaveProperty('content');
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0].text).toContain('Test User');
  });

  test('should handle API errors', async () => {
    // Sample tool
    const tools = [
      {
        name: 'get_user',
        description: 'Get user by ID',
        parameters: { userId: 'string' },
        method: 'get',
        path: '/users/{userId}'
      }
    ];
    
    // Mock processParameters
    mockApiClient.processParameters.mockReturnValue({
      pathParams: { userId: '999' },
      queryParams: {},
      bodyParams: {}
    });
    
    // Mock request error
    const error = {
      message: 'User not found',
      data: { error: 'Not found' }
    };
    mockApiClient.request.mockRejectedValue(error);
    
    // Generate tools
    generator.generateTools(mockServer, tools, {
      baseUrl: 'http://api.example.com'
    });
    
    // Get the callback function
    const callback = mockServer.tool.mock.calls[0][2];
    
    // Call the tool
    const result = await callback({ userId: '999' });
    
    // Verify error handling
    expect(result).toHaveProperty('content');
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0].text).toContain('Error: User not found');
  });
});
