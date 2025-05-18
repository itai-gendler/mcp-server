const { z } = require('zod');

/**
 * Base class for OpenAPI to MCP converters
 */
class BaseOpenApiConverter {
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Convert OpenAPI schema to MCP tools
   * @returns {Array<object>} Array of MCP tool definitions
   */
  convertToMcpTools() {
    throw new Error('Method not implemented');
  }

  /**
   * Convert OpenAPI schema parameter to Zod schema
   * @param {object} parameter - OpenAPI parameter object
   * @returns {object} Zod schema
   */
  convertParameterToZod(parameter) {
    throw new Error('Method not implemented');
  }

  /**
   * Convert OpenAPI schema to Zod schemas
   * @returns {object} Object with Zod schemas
   */
  convertToZodSchemas() {
    throw new Error('Method not implemented');
  }

  /**
   * Generate a tool name from an operation
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {object} operation - Operation object
   * @returns {string} Tool name
   */
  generateToolName(path, method, operation) {
    // Default implementation - can be overridden by subclasses
    const operationId = operation.operationId;
    if (operationId) {
      return operationId;
    }
    
    // Generate a name from the path and method
    const pathParts = path.split('/').filter(part => part.length > 0);
    
    // Remove common prefixes
    const commonPrefixes = ['api']; // List of common prefixes to remove
    let startIndex = 0;
    
    // Check if the first part of the path is a common prefix
    if (pathParts.length > 0 && commonPrefixes.includes(pathParts[0].toLowerCase())) {
      startIndex = 1; // Skip the first part
    }
    
    // Process the remaining path parts
    const cleanPath = pathParts.slice(startIndex).map(part => {
      // Replace path parameters with their names
      if (part.startsWith('{') && part.endsWith('}')) {
        return `By${part.substring(1, part.length - 1)}`;
      }
      return part;
    }).join('_');
    
    // If after removing prefixes we have an empty path, use a default name
    const finalPath = cleanPath || 'root';
    
    return `${method.toLowerCase()}_${finalPath}`;
  }

  /**
   * Generate a description for a tool
   * @param {object} operation - Operation object
   * @returns {string} Tool description
   */
  generateToolDescription(operation) {
    if (operation.summary) {
      return operation.summary;
    }
    if (operation.description) {
      return operation.description;
    }
    return 'No description available';
  }
}

module.exports = BaseOpenApiConverter;
