const { detectOpenApiVersion } = require('../utils/openapi-loader');
const OpenApi3Converter = require('./openapi3-converter');
const Swagger2Converter = require('./swagger2-converter');

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
      case '2.0':
        return new Swagger2Converter(schema);
      case '3.0':
        return new OpenApi3Converter(schema);
      case '3.1':
        // Currently using the OpenAPI 3.0 converter for 3.1 as well
        // In the future, we can implement a specific converter for 3.1 if needed
        return new OpenApi3Converter(schema);
      default:
        throw new Error(`Unsupported OpenAPI version: ${version}`);
    }
  }
}

module.exports = ConverterFactory;
