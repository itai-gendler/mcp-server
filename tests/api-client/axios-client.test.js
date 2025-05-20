const AxiosApiClient = require('../../src/api-client/axios-client');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('AxiosApiClient', () => {
  let client;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new client
    client = new AxiosApiClient({
      baseUrl: 'http://api.example.com',
      headers: { 'X-API-Key': 'test-key' },
      timeout: 5000
    });
  });

  test('should create client with correct options', () => {
    expect(client.baseUrl).toBe('http://api.example.com');
    expect(client.headers).toHaveProperty('X-API-Key', 'test-key');
    expect(client.headers).toHaveProperty('Content-Type', 'application/json');
    expect(client.timeout).toBe(5000);
  });

  test('should make GET request with correct parameters', async () => {
    // Mock axios response
    axios.mockResolvedValue({
      data: { result: 'success' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    });
    
    // Make a GET request
    const response = await client.request({
      method: 'get',
      path: '/users',
      queryParams: { limit: 10, offset: 0 }
    });
    
    // Verify axios was called with correct parameters
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: 'http://api.example.com/users',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': 'test-key'
      }),
      timeout: 5000,
      params: { limit: 10, offset: 0 }
    });
    
    // Verify response
    expect(response).toHaveProperty('data.result', 'success');
    expect(response).toHaveProperty('status', 200);
  });

  test('should make POST request with correct parameters', async () => {
    // Mock axios response
    axios.mockResolvedValue({
      data: { id: '123', name: 'Test User' },
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' }
    });
    
    // Make a POST request
    const response = await client.request({
      method: 'post',
      path: '/users',
      bodyParams: { name: 'Test User', email: 'test@example.com' }
    });
    
    // Verify axios was called with correct parameters
    expect(axios).toHaveBeenCalledWith({
      method: 'post',
      url: 'http://api.example.com/users',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': 'test-key'
      }),
      timeout: 5000,
      data: { name: 'Test User', email: 'test@example.com' }
    });
    
    // Verify response
    expect(response).toHaveProperty('data.id', '123');
    expect(response).toHaveProperty('status', 201);
  });

  test('should handle path parameters correctly', async () => {
    // Mock axios response
    axios.mockResolvedValue({
      data: { id: '123', name: 'Test User' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    });
    
    // Make a request with path parameters
    const response = await client.request({
      method: 'get',
      path: '/users/{userId}/profile',
      pathParams: { userId: '123' }
    });
    
    // Verify axios was called with correct URL
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://api.example.com/users/123/profile'
    }));
    
    // Verify response
    expect(response).toHaveProperty('data.id', '123');
  });

  test('should handle error responses correctly', async () => {
    // Mock axios error
    const errorResponse = {
      response: {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'User not found' }
      }
    };
    axios.mockRejectedValue(errorResponse);
    
    // Make a request that will fail
    await expect(client.request({
      method: 'get',
      path: '/users/999'
    })).rejects.toMatchObject({
      status: 404,
      statusText: 'Not Found',
      data: { error: 'User not found' }
    });
  });

  test('should handle network errors correctly', async () => {
    // Mock axios network error
    const networkError = new Error('Network Error');
    axios.mockRejectedValue(networkError);
    
    // Make a request that will fail
    await expect(client.request({
      method: 'get',
      path: '/users'
    })).rejects.toMatchObject({
      message: 'Request Error: Network Error'
    });
  });

  test('should process parameters correctly', () => {
    const params = {
      userId: '123',
      limit: 10,
      name: 'Test User'
    };
    
    // Test GET method parameter processing
    const getResult = client.processParameters(params, '/users/{userId}', 'get');
    expect(getResult).toEqual({
      pathParams: { userId: '123' },
      queryParams: { limit: 10, name: 'Test User' },
      bodyParams: {}
    });
    
    // Test POST method parameter processing
    const postResult = client.processParameters(params, '/users/{userId}', 'post');
    expect(postResult).toEqual({
      pathParams: { userId: '123' },
      queryParams: { limit: 10, name: 'Test User' },
      bodyParams: {}
    });
  });
  
  test('should unwrap body parameter for POST requests when wrapped', () => {
    // Test case where the LLM wraps the body with another body
    const wrappedParams = {
      body: {
        name: 'Test User',
        status: 'active',
        details: {
          first_name: 'Test'
        }
      }
    };
    
    // Test POST method with wrapped body
    const postResult = client.processParameters(wrappedParams, '/api/person', 'post');
    // Should use the contents of body as bodyParams
    expect(postResult).toEqual({
      pathParams: {},
      queryParams: {},
      bodyParams: {
        name: 'Test User',
        status: 'active',
        details: {
          first_name: 'Test'
        }
      }
    });
  });
  
  test('should unwrap body parameter for PUT requests when wrapped', () => {
    // Test case where the LLM wraps the body with another body
    const wrappedParams = {
      body: {
        name: 'Updated User',
        status: 'inactive'
      }
    };
    
    // Test PUT method with wrapped body
    const putResult = client.processParameters(wrappedParams, '/api/person/123', 'put');
    // Should use the contents of body as bodyParams
    expect(putResult).toEqual({
      pathParams: {},
      queryParams: {},
      bodyParams: {
        name: 'Updated User',
        status: 'inactive'
      }
    });
  });
  
  test('should not unwrap body parameter when it is not the only parameter', () => {
    // Test case where there's a body parameter but also other parameters
    const params = {
      userId: '123',
      body: {
        name: 'Test User',
        status: 'active'
      }
    };
    
    // Test POST method with body and other parameters
    const postResult = client.processParameters(params, '/users/{userId}', 'post');
    
    // Should use the contents of body as bodyParams, other non-path keys are ignored
    expect(postResult).toEqual({
      pathParams: { userId: '123' },
      queryParams: {},
      bodyParams: {
        name: 'Test User',
        status: 'active'
      }
    });
  });
  
  test('should not unwrap body parameter for GET requests', () => {
    // Test case where there's a body parameter in a GET request
    const params = {
      body: {
        filter: 'active'
      }
    };
    
    // Test GET method with body parameter
    const getResult = client.processParameters(params, '/users', 'get');
    
    // Should ignore 'body' param for GET requests
    expect(getResult).toEqual({
      pathParams: {},
      queryParams: {},
      bodyParams: {}
    });
  });
});
