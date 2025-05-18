const SecurityPolicyExtractor = require('../../src/schema-loader/security-policy-extractor');

describe('SecurityPolicyExtractor', () => {
  describe('extractSecurityRequirements', () => {
    test('should extract security schemes from OpenAPI 3.0 schema', () => {
      const schema = {
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            },
            BearerAuth: {
              type: 'http',
              scheme: 'bearer'
            }
          }
        },
        security: [
          { ApiKeyAuth: [] }
        ]
      };
      
      const result = SecurityPolicyExtractor.extractSecurityRequirements(schema);
      
      expect(result).toBeDefined();
      expect(result.globalSecurity).toEqual([{ ApiKeyAuth: [] }]);
      expect(result.securitySchemes).toBeDefined();
      expect(result.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(result.securitySchemes.ApiKeyAuth.type).toBe('apiKey');
      expect(result.securitySchemes.ApiKeyAuth.in).toBe('header');
      expect(result.securitySchemes.ApiKeyAuth.name).toBe('X-API-Key');
    });
    
    test('should extract security schemes from OpenAPI 2.0 schema', () => {
      const schema = {
        securityDefinitions: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        },
        security: [
          { ApiKeyAuth: [] }
        ]
      };
      
      const result = SecurityPolicyExtractor.extractSecurityRequirements(schema);
      
      expect(result).toBeDefined();
      expect(result.globalSecurity).toEqual([{ ApiKeyAuth: [] }]);
      expect(result.securitySchemes).toBeDefined();
      expect(result.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(result.securitySchemes.ApiKeyAuth.type).toBe('apiKey');
      expect(result.securitySchemes.ApiKeyAuth.in).toBe('header');
      expect(result.securitySchemes.ApiKeyAuth.name).toBe('X-API-Key');
    });
    
    test('should return empty arrays if no security schemes are defined', () => {
      const schema = {
        paths: {}
      };
      
      const result = SecurityPolicyExtractor.extractSecurityRequirements(schema);
      
      expect(result).toBeDefined();
      expect(result.globalSecurity).toEqual([]);
      expect(result.securitySchemes).toEqual({});
    });
    
    test('should return null if schema is null or undefined', () => {
      expect(SecurityPolicyExtractor.extractSecurityRequirements(null)).toBeNull();
      expect(SecurityPolicyExtractor.extractSecurityRequirements(undefined)).toBeNull();
    });
  });
  
  describe('getEnvVarName', () => {
    test('should convert header name to environment variable format', () => {
      expect(SecurityPolicyExtractor.getEnvVarName('X-API-Key')).toBe('X_API_KEY');
      expect(SecurityPolicyExtractor.getEnvVarName('Authorization')).toBe('AUTHORIZATION');
      expect(SecurityPolicyExtractor.getEnvVarName('x-custom-header')).toBe('X_CUSTOM_HEADER');
      expect(SecurityPolicyExtractor.getEnvVarName('X.API.Key')).toBe('X_API_KEY');
    });
  });
  
  describe('getSecurityHeaders', () => {
    const originalEnv = process.env;
    
    beforeEach(() => {
      // Save original environment variables
      process.env = { ...originalEnv };
      
      // Set up test environment variables
      process.env.X_API_KEY = 'test-api-key';
      process.env.AUTHORIZATION = 'Bearer test-token';
    });
    
    afterEach(() => {
      // Restore original environment variables
      process.env = originalEnv;
    });
    
    test('should get security headers from environment variables', () => {
      const securitySchemes = {
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
      };
      
      const headers = SecurityPolicyExtractor.getSecurityHeaders(securitySchemes);
      
      expect(headers).toBeDefined();
      expect(headers['X-API-Key']).toBe('test-api-key');
      expect(headers['Authorization']).toBe('Bearer test-token');
    });
    
    test('should ignore security schemes that are not apiKey in header', () => {
      const securitySchemes = {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        QueryAuth: {
          type: 'apiKey',
          in: 'query',
          name: 'api_key'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      };
      
      const headers = SecurityPolicyExtractor.getSecurityHeaders(securitySchemes);
      
      expect(headers).toBeDefined();
      expect(headers['X-API-Key']).toBe('test-api-key');
      expect(headers['api_key']).toBeUndefined();
      expect(headers['Authorization']).toBeUndefined();
    });
    
    test('should return empty object if no security schemes are provided', () => {
      expect(SecurityPolicyExtractor.getSecurityHeaders({})).toEqual({});
      expect(SecurityPolicyExtractor.getSecurityHeaders(null)).toEqual({});
      expect(SecurityPolicyExtractor.getSecurityHeaders(undefined)).toEqual({});
    });
  });
});
