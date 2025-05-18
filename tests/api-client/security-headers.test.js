const AxiosApiClient = require('../../src/api-client/axios-client');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('AxiosApiClient Security Headers', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Save original environment variables
    process.env = { ...originalEnv };
    
    // Set up test environment variables
    process.env.X_API_KEY = 'test-api-key';
    process.env.AUTHORIZATION = 'Bearer test-token';
    
    // Mock axios to return a successful response
    axios.mockResolvedValue({
      data: { result: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {}
    });
  });
  
  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  test('should add security headers from environment variables', async () => {
    // Create API client with security schemes
    const apiClient = new AxiosApiClient({
      baseUrl: 'http://example.com',
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    });
    
    // Make a request with security requirements
    await apiClient.request({
      method: 'GET',
      path: '/api/resource',
      security: [{ ApiKeyAuth: [] }]
    });
    
    // Check that axios was called with the correct headers
    expect(axios).toHaveBeenCalledTimes(1);
    const axiosConfig = axios.mock.calls[0][0];
    expect(axiosConfig.headers['X-API-Key']).toBe('test-api-key');
  });
  
  test('should add multiple security headers', async () => {
    // Create API client with multiple security schemes
    const apiClient = new AxiosApiClient({
      baseUrl: 'http://example.com',
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        BearerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization'
        }
      }
    });
    
    // Make a request with security requirements
    await apiClient.request({
      method: 'GET',
      path: '/api/resource',
      security: [{ ApiKeyAuth: [], BearerAuth: [] }]
    });
    
    // Check that axios was called with the correct headers
    expect(axios).toHaveBeenCalledTimes(1);
    const axiosConfig = axios.mock.calls[0][0];
    expect(axiosConfig.headers['X-API-Key']).toBe('test-api-key');
    expect(axiosConfig.headers['Authorization']).toBe('Bearer test-token');
  });
  
  test('should not add security headers if environment variables are not set', async () => {
    // Remove environment variables
    delete process.env.X_API_KEY;
    
    // Create API client with security schemes and disable strict security
    const apiClient = new AxiosApiClient({
      baseUrl: 'http://example.com',
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      strictSecurity: false // Explicitly disable strict security for this test
    });
    
    // Make a request with security requirements
    await apiClient.request({
      method: 'GET',
      path: '/api/resource',
      security: [{ ApiKeyAuth: [] }]
    });
    
    // Check that axios was called without the security header
    expect(axios).toHaveBeenCalledTimes(1);
    const axiosConfig = axios.mock.calls[0][0];
    expect(axiosConfig.headers['X-API-Key']).toBeUndefined();
  });
  
  test('should not add security headers if no security requirements are provided', async () => {
    // Create API client with security schemes
    const apiClient = new AxiosApiClient({
      baseUrl: 'http://example.com',
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    });
    
    // Make a request without security requirements
    await apiClient.request({
      method: 'GET',
      path: '/api/resource'
    });
    
    // Check that axios was called without the security header
    expect(axios).toHaveBeenCalledTimes(1);
    const axiosConfig = axios.mock.calls[0][0];
    expect(axiosConfig.headers['X-API-Key']).toBeUndefined();
  });
});
