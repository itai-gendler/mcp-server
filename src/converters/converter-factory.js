const { detectOpenApiVersion } = require('../utils/openapi-loader');
const OpenApi3Converter = require('./openapi3-converter');

/**
 * Factory for creating the appropriate OpenAPI converter
 */
class ConverterFactory {
  /**
   * Create a converter for the given OpenAPI schema
   * @param {object} schema - OpenAPI schema
   * @returns {BaseOpenApiConverter} Converter instance
   */
  static createConverter(schema) {
    const version = detectOpenApiVersion(schema);
    
    switch (version) {
      case '3.0':
      case '3.1':
        // Currently using the OpenAPI 3.0 converter for both 3.0 and 3.1
        // In the future, we can implement a specific converter for 3.1 if needed
        return new OpenApi3Converter(schema);
      case '2.0':
        throw new Error('Swagger 2.0 (OpenAPI 2.0) is no longer supported');
      default:
        throw new Error(`Unsupported OpenAPI version: ${version}`);
    }
  }
}

module.exports = ConverterFactory;
