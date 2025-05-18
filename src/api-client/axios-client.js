const axios = require('axios');

/**
 * API client for making HTTP requests to API endpoints
 */
class AxiosApiClient {
  /**
   * Create a new API client
   * @param {object} options - API client options
   * @param {string} options.baseUrl - Base URL for API requests
   * @param {object} options.headers - Default headers for API requests
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {object} options.securitySchemes - Security schemes from OpenAPI schema
   * @param {boolean} options.strictSecurity - Whether to throw an error when a required security token is missing
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };
    this.timeout = options.timeout || 30000;
    this.securitySchemes = options.securitySchemes || {};
    this.strictSecurity = options.strictSecurity !== undefined ? options.strictSecurity : true;
  }

  /**
   * Make an API request
   * @param {object} config - Request configuration
   * @param {string} config.method - HTTP method
   * @param {string} config.path - API endpoint path
   * @param {object} config.pathParams - Path parameters
   * @param {object} config.queryParams - Query parameters
   * @param {object} config.bodyParams - Body parameters
   * @returns {Promise<object>} API response
   */
  async request(config) {
    try {
      const { method, path, pathParams = {}, queryParams = {}, bodyParams = {} } = config;
      
      // Replace path parameters in the URL
      let url = path;
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      });
      
      // Prepend the base URL
      const fullUrl = `${this.baseUrl}${url}`;
      
      // Prepare the request config
      const axiosConfig = {
        method: method.toLowerCase(),
        url: fullUrl,
        headers: {
          ...this.headers,
          ...this.getSecurityHeaders(config.security)
        },
        timeout: this.timeout
      };
      
      // Add query parameters if any
      if (Object.keys(queryParams).length > 0) {
        axiosConfig.params = queryParams;
      }
      
      // Add body parameters for non-GET/DELETE requests
      if (method.toLowerCase() !== 'get' && method.toLowerCase() !== 'delete' && Object.keys(bodyParams).length > 0) {
        axiosConfig.data = bodyParams;
      }
      
      // Make the API call
      const response = await axios(axiosConfig);
      
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      // Format error response
      if (error.response) {
        throw {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          message: `API Error: ${error.response.status} ${error.response.statusText}`
        };
      } else {
        throw {
          message: `Request Error: ${error.message}`,
          originalError: error
        };
      }
    }
  }

  /**
   * Process parameters from an MCP tool call
   * @param {object} params - Parameters from MCP tool call
   * @param {string} path - API endpoint path
   * @param {string} method - HTTP method
   * @returns {object} Processed parameters
   */
  processParameters(params, path, method) {
    const pathParams = {};
    const queryParams = {};
    const bodyParams = {};
    
    // Handle the case where the LLM wraps the body with another body
    // (e.g., { body: { actual: "payload" } } instead of just { actual: "payload" })
    let processedParams = { ...params };
    
    // Check if there's a single 'body' parameter for POST/PUT/PATCH methods
    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && 
        Object.keys(processedParams).length === 1 && 
        processedParams.body && 
        typeof processedParams.body === 'object') {
      console.log('Detected wrapped body parameter, unwrapping it');
      processedParams = processedParams.body;
    }
    
    // Process parameters based on their location (path, query, body)
    Object.entries(processedParams).forEach(([key, value]) => {
      // Check if this is a path parameter
      if (path.includes(`{${key}}`)) {
        pathParams[key] = value;
      } else if (method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') {
        // For GET and DELETE requests, all non-path params go to query
        queryParams[key] = value;
      } else {
        // For POST, PUT, PATCH, etc., non-path params go to body
        bodyParams[key] = value;
      }
    });
    
    return { pathParams, queryParams, bodyParams };
  }
  
  /**
   * Get security headers based on security requirements
   * @param {object} security - Security requirements for the request
   * @returns {object} Headers with security tokens
   * @throws {Error} When strictSecurity is true and a required security token is missing
   */
  getSecurityHeaders(security = {}) {
    const headers = {};
    
    // If no security requirements or no security schemes, return empty headers
    if (!security || !this.securitySchemes || Object.keys(this.securitySchemes).length === 0) {
      return headers;
    }
    
    // Only add security headers if security requirements are provided
    // and they are in the expected format (array of objects)
    if (!Array.isArray(security) || security.length === 0) {
      return headers;
    }
    
    // Get the list of required security schemes from the security requirements
    const requiredSchemes = new Set();
    security.forEach(requirement => {
      Object.keys(requirement).forEach(schemeName => {
        requiredSchemes.add(schemeName);
      });
    });
    
    // Process each security scheme
    Object.entries(this.securitySchemes).forEach(([name, scheme]) => {
      // Skip if this scheme is not required
      if (!requiredSchemes.has(name)) {
        return;
      }
      
      // Currently only supporting apiKey type in header
      if (scheme.type === 'apiKey' && scheme.in === 'header') {
        const headerName = scheme.name;
        const envVarName = this.getEnvVarName(headerName);
        
        // Get token from environment variable
        const token = process.env[envVarName];
        
        // Add token to headers if available
        if (token) {
          headers[headerName] = token;
        } else if (this.strictSecurity) {
          // Throw an error when strictSecurity is true and a required security token is missing
          throw new Error(`Required security token '${headerName}' (environment variable: ${envVarName}) is missing`);
        }
      }
    });
    
    return headers;
  }
  
  /**
   * Get environment variable name for a security token
   * @param {string} headerName - Header name from security scheme
   * @returns {string} Environment variable name
   */
  getEnvVarName(headerName) {
    // Convert header name to environment variable format
    // e.g., 'X-API-Key' becomes 'X_API_KEY'
    return headerName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();
  }
}

module.exports = AxiosApiClient;
