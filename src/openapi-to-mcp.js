const { loadOpenApiFromFile, loadOpenApiFromUrl, loadOpenApiFromDirectory } = require('./utils/openapi-loader');
const ConverterFactory = require('./converters/converter-factory');
const McpToolGenerator = require('./mcp-tools/tool-generator');
const SchemaUrlExtractor = require('./schema-loader/schema-url-extractor');
const path = require('path');

/**
 * Main class for converting OpenAPI schemas to MCP tools
 */
class OpenApiToMcp {
  /**
   * Create a new OpenApiToMcp instance
   * @param {object} options - Options for the converter
   */
  constructor(options = {}) {
    this.options = options;
    this.schema = null;
    this.schemas = [];
    this.converter = null;
    this.converters = [];
  }

  /**
   * Load an OpenAPI schema from a file
   * @param {string} filePath - Path to the OpenAPI schema file
   * @returns {Promise<OpenApiToMcp>} This instance for chaining
   */
  async loadFromFile(filePath) {
    this.schema = await loadOpenApiFromFile(filePath);
    this.converter = ConverterFactory.createConverter(this.schema);
    return this;
  }

  /**
   * Load OpenAPI schemas from a directory
   * @param {string} dirPath - Path to the directory containing OpenAPI schema files
   * @returns {Promise<OpenApiToMcp>} This instance for chaining
   */
  async loadFromDirectory(dirPath) {
    this.schemas = await loadOpenApiFromDirectory(dirPath);
    this.converters = this.schemas.map(({ schema }) => (
      ConverterFactory.createConverter(schema)
    ));
    return this;
  }

  /**
   * Load an OpenAPI schema from a URL
   * @param {string} url - URL to the OpenAPI schema
   * @returns {Promise<OpenApiToMcp>} This instance for chaining
   */
  async loadFromUrl(url) {
    this.schema = await loadOpenApiFromUrl(url);
    this.converter = ConverterFactory.createConverter(this.schema);
    return this;
  }

  /**
   * Load an OpenAPI schema from an object
   * @param {object} schema - OpenAPI schema object
   * @returns {OpenApiToMcp} This instance for chaining
   */
  loadFromObject(schema) {
    this.schema = schema;
    this.converter = ConverterFactory.createConverter(this.schema);
    return this;
  }

  /**
   * Convert the loaded OpenAPI schema to MCP tools
   * @returns {Array<object>} Array of MCP tool definitions
   */
  convertToMcpTools() {
    if (!this.converter) {
      throw new Error('No OpenAPI schema loaded. Call loadFromFile() or loadFromObject() first.');
    }
    return this.converter.convertToMcpTools();
  }

  /**
   * Convert the loaded OpenAPI schema to Zod schemas
   * @returns {object} Object with Zod schemas
   */
  convertToZodSchemas() {
    if (!this.converter) {
      throw new Error('No OpenAPI schema loaded. Call loadFromFile() or loadFromObject() first.');
    }
    return this.converter.convertToZodSchemas();
  }

  /**
   * Get the base URL from the loaded schema
   * @returns {string|null} Base URL or null if not found
   */
  getBaseUrlFromSchema() {
    if (this.schema) {
      return SchemaUrlExtractor.getBaseUrl(this.schema);
    }
    return null;
  }

  /**
   * Generate MCP tools for a server
   * @param {McpServer} server - MCP server instance
   * @param {object} apiOptions - API client options
   * @returns {Promise<void>}
   */
  async generateMcpServerTools(server, apiOptions = {}) {
    if (!this.schema && this.schemas.length === 0) {
      throw new Error('No OpenAPI schema loaded. Call loadFromFile, loadFromUrl, loadFromDirectory, or loadFromObject first.');
    }

    // If we have multiple schemas from a directory
    if (this.schemas.length > 0) {
      for (let i = 0; i < this.schemas.length; i++) {
        const { schema, filePath } = this.schemas[i];
        const converter = this.converters[i];
        
        // Clone apiOptions to avoid modifying the original
        const schemaApiOptions = { ...apiOptions };
        
        // Extract base URL from schema if not provided in options
        if (!schemaApiOptions.baseUrl) {
          // Temporarily set this.schema to the current schema to use getBaseUrlFromSchema
          const originalSchema = this.schema;
          this.schema = schema;
          const baseUrl = this.getBaseUrlFromSchema();
          // Restore the original schema
          this.schema = originalSchema;
          
          if (baseUrl) {
            schemaApiOptions.baseUrl = baseUrl;
          }
        }

        // Convert schema to MCP tools
        const tools = converter.convertToMcpTools();
        
        // Generate tools with API client functionality
        const generator = new McpToolGenerator();
        generator.generateTools(server, tools, schemaApiOptions);
        
        console.log(`Successfully loaded and registered tools from: ${path.basename(filePath)}`);
      }
      return;
    }

    // Extract base URL from schema if not provided in options
    if (!apiOptions.baseUrl) {
      const baseUrl = this.getBaseUrlFromSchema();
      if (baseUrl) {
        apiOptions.baseUrl = baseUrl;
      }
    }

    // Convert schema to MCP tools
    const tools = this.convertToMcpTools();

    // Generate tools with API client functionality
    const generator = new McpToolGenerator();
    generator.generateTools(server, tools, apiOptions);
  }
  
  /**
   * Get the base URL from the OpenAPI schema
   * @returns {string|null} Base URL or null if not found
   */
  getBaseUrlFromSchema() {
    return SchemaUrlExtractor.getBaseUrl(this.schema);
  }
}

module.exports = OpenApiToMcp;
