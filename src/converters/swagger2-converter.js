const { z } = require('zod');
const BaseOpenApiConverter = require('./base-converter');

/**
 * Converter for Swagger 2.0 (OpenAPI 2.0) schemas
 */
class Swagger2Converter extends BaseOpenApiConverter {
  /**
   * Convert Swagger 2.0 schema to MCP tools
   * @returns {Array<object>} Array of MCP tool definitions
   */
  convertToMcpTools() {
    const tools = [];
    const paths = this.schema.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        // Skip if not an HTTP method
        if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          continue;
        }

        const toolName = this.generateToolName(path, method, operation);
        const toolDescription = this.generateToolDescription(operation);
        const parameters = this.extractParameters(operation, path);
        const zodSchema = this.convertParametersToZodSchema(parameters);

        tools.push({
          name: toolName,
          description: toolDescription,
          parameters: zodSchema,
          method,
          path
        });
      }
    }

    return tools;
  }

  /**
   * Extract parameters from an operation
   * @param {object} operation - Operation object
   * @param {string} path - API path
   * @returns {Array<object>} Array of parameters
   */
  extractParameters(operation, path) {
    const parameters = [];

    // All parameters (path, query, body, etc.)
    if (operation.parameters && Array.isArray(operation.parameters)) {
      parameters.push(...operation.parameters);
    }

    return parameters;
  }

  /**
   * Convert parameters to Zod schema
   * @param {Array<object>} parameters - Array of parameters
   * @returns {object} Zod schema
   */
  convertParametersToZodSchema(parameters) {
    const schema = {};

    for (const param of parameters) {
      schema[param.name] = this.convertParameterToZod(param);
    }

    return schema;
  }

  /**
   * Convert Swagger parameter to Zod schema
   * @param {object} parameter - Swagger parameter object
   * @returns {object} Zod schema
   */
  convertParameterToZod(parameter) {
    let zodSchema;

    // Handle body parameter with schema reference
    if (parameter.in === 'body' && parameter.schema) {
      return this.convertSchemaToZod(parameter.schema);
    }

    // Handle parameter type
    const type = parameter.type;
    const format = parameter.format;

    switch (type) {
      case 'string':
        zodSchema = z.string();
        if (parameter.enum) {
          zodSchema = z.enum(parameter.enum);
        }
        if (parameter.pattern) {
          zodSchema = zodSchema.regex(new RegExp(parameter.pattern));
        }
        if (parameter.minLength !== undefined) {
          zodSchema = zodSchema.min(parameter.minLength);
        }
        if (parameter.maxLength !== undefined) {
          zodSchema = zodSchema.max(parameter.maxLength);
        }
        if (format === 'date-time' || format === 'date') {
          zodSchema = z.string().datetime();
        }
        if (format === 'email') {
          zodSchema = z.string().email();
        }
        if (format === 'uri') {
          zodSchema = z.string().url();
        }
        break;
      case 'number':
      case 'integer':
        zodSchema = type === 'integer' ? z.number().int() : z.number();
        if (parameter.minimum !== undefined) {
          zodSchema = zodSchema.min(parameter.minimum);
        }
        if (parameter.maximum !== undefined) {
          zodSchema = zodSchema.max(parameter.maximum);
        }
        break;
      case 'boolean':
        zodSchema = z.boolean();
        break;
      case 'array':
        if (parameter.items) {
          const itemSchema = this.convertParameterToZod(parameter.items);
          zodSchema = z.array(itemSchema);
          if (parameter.minItems !== undefined) {
            zodSchema = zodSchema.min(parameter.minItems);
          }
          if (parameter.maxItems !== undefined) {
            zodSchema = zodSchema.max(parameter.maxItems);
          }
        } else {
          zodSchema = z.array(z.any());
        }
        break;
      case 'object':
        if (parameter.properties) {
          const shape = {};
          for (const [propName, propSchema] of Object.entries(parameter.properties)) {
            shape[propName] = this.convertParameterToZod(propSchema);
          }
          zodSchema = z.object(shape);
          
          // Handle required properties
          if (parameter.required && Array.isArray(parameter.required)) {
            const required = {};
            for (const reqProp of parameter.required) {
              if (shape[reqProp]) {
                required[reqProp] = shape[reqProp];
              }
            }
            // Apply required fields if any exist
            if (Object.keys(required).length > 0) {
              zodSchema = zodSchema.required(required);
            }
          }
        } else {
          zodSchema = z.record(z.any());
        }
        break;
      default:
        zodSchema = z.any();
    }

    // Handle default value
    if (parameter.default !== undefined) {
      zodSchema = zodSchema.default(parameter.default);
    }

    // Handle required flag
    if (!parameter.required) {
      zodSchema = zodSchema.optional();
    }

    return zodSchema;
  }

  /**
   * Convert Swagger 2.0 schema to Zod schemas
   * @returns {object} Object with Zod schemas
   */
  convertToZodSchemas() {
    const zodSchemas = {};
    const definitions = this.schema.definitions || {};

    for (const [schemaName, schema] of Object.entries(definitions)) {
      try {
        const zodSchema = this.convertSchemaToZod(schema);
        zodSchemas[schemaName] = zodSchema;
      } catch (error) {
        console.error(`Error converting schema ${schemaName}:`, error);
      }
    }

    return zodSchemas;
  }

  /**
   * Convert Swagger schema to Zod schema
   * @param {object} schema - Swagger schema
   * @returns {object} Zod schema
   */
  convertSchemaToZod(schema) {
    // Handle references
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/definitions/', '');
      // Return a function that will be resolved later to avoid circular references
      return () => this.convertSchemaToZod(this.schema.definitions[refPath]);
    }

    // Handle allOf
    if (schema.allOf) {
      const schemas = schema.allOf.map(s => this.convertSchemaToZod(s));
      return z.intersection(...schemas);
    }

    // Handle basic types
    return this.convertParameterToZod(schema);
  }
}

module.exports = Swagger2Converter;
