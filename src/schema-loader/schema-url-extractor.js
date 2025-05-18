/**
 * Extracts base URLs from OpenAPI schemas
 */
class SchemaUrlExtractor {
  /**
   * Get the base URL from an OpenAPI schema
   * @param {object} schema - OpenAPI schema
   * @returns {string|null} Base URL or null if not found
   */
  static getBaseUrl(schema) {
    if (!schema) {
      return null;
    }
    
    // For OpenAPI 3.x
    if (schema.servers && schema.servers.length > 0) {
      return schema.servers[0].url;
    }
    
    // For OpenAPI 2.0 (Swagger)
    if (schema.host) {
      const scheme = schema.schemes && schema.schemes.length > 0 
        ? schema.schemes[0] 
        : 'https';
      const basePath = schema.basePath || '';
      return `${scheme}://${schema.host}${basePath}`;
    }
    
    return null;
  }
}

module.exports = SchemaUrlExtractor;
