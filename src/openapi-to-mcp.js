const { loadOpenApiFromFile, loadOpenApiFromUrl } = require('./utils/openapi-loader');
const ConverterFactory = require('./converters/converter-factory');
const McpToolGenerator = require('./mcp-tools/tool-generator');
const SchemaUrlExtractor = require('./schema-loader/schema-url-extractor');

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
    this.converter = null;
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
   * Generate MCP server tools from the loaded OpenAPI schema
   * @param {McpServer} server - MCP server instance
   * @param {object} options - Options for the API calls
   * @param {string} options.baseUrl - Base URL for the API calls (overrides the server URL from the schema)
   * @param {object} options.headers - Default headers to include in all requests
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<void>}
   */
  async generateMcpServerTools(server, options = {}) {
    if (!this.converter) {
      throw new Error('No OpenAPI schema loaded. Call loadFromFile() or loadFromObject() first.');
    }

    const tools = this.convertToMcpTools();
    
    // Get the base URL from options or from the schema
    const baseUrl = options.baseUrl || this.getBaseUrlFromSchema();
    if (!baseUrl) {
      console.warn('No base URL provided and none found in schema. API calls will likely fail.');
    }
    
    // Configure API options
    const apiOptions = {
      baseUrl,
      headers: options.headers || {},
      timeout: options.timeout || 30000
    };
    
    // Generate MCP tools
    const toolGenerator = new McpToolGenerator();
    toolGenerator.generateTools(server, tools, apiOptions);
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
