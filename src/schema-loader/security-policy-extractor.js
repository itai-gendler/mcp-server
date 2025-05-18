/**
 * Extracts security policies from OpenAPI schemas
 */
class SecurityPolicyExtractor {
  /**
   * Extract security requirements from an OpenAPI schema
   * @param {object} schema - OpenAPI schema
   * @returns {object|null} Security requirements or null if not found
   */
  static extractSecurityRequirements(schema) {
    if (!schema) {
      return null;
    }
    
    // Get global security requirements
    const globalSecurity = schema.security || [];
    
    // Get security schemes
    const securitySchemes = 
      (schema.components && schema.components.securitySchemes) || 
      (schema.securityDefinitions) || // For OpenAPI 2.0
      {};
    
    return {
      globalSecurity,
      securitySchemes
    };
  }
  
  /**
   * Get environment variable name for a security token
   * @param {string} headerName - Header name from security scheme
   * @returns {string} Environment variable name
   */
  static getEnvVarName(headerName) {
    // Convert header name to environment variable format
    // e.g., 'X-API-Key' becomes 'X_API_KEY'
    return headerName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();
  }
  
  /**
   * Get security headers from environment variables based on security schemes
   * @param {object} securitySchemes - Security schemes from OpenAPI schema
   * @returns {object} Headers with security tokens
   */
  static getSecurityHeaders(securitySchemes) {
    const headers = {};
    
    // If no security schemes are provided, return empty headers
    if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
      return headers;
    }
    
    // Process each security scheme
    Object.entries(securitySchemes).forEach(([name, scheme]) => {
      // Currently only supporting apiKey type in header
      if (scheme.type === 'apiKey' && scheme.in === 'header') {
        const headerName = scheme.name;
        const envVarName = this.getEnvVarName(headerName);
        
        // Get token from environment variable
        const token = process.env[envVarName];
        
        // Add token to headers if available
        if (token) {
          headers[headerName] = token;
        }
      }
    });
    
    return headers;
  }
}

module.exports = SecurityPolicyExtractor;
