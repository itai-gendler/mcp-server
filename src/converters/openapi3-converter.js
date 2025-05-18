const { z } = require('zod');
const BaseOpenApiConverter = require('./base-converter');

/**
 * Converter for OpenAPI 3.0 schemas
 */
class OpenApi3Converter extends BaseOpenApiConverter {
  /**
   * Convert OpenAPI 3.0 schema to MCP tools
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

    // Path parameters
    const pathParams = (operation.parameters || []).filter(param => param.in === 'path');
    parameters.push(...pathParams);

    // Query parameters
    const queryParams = (operation.parameters || []).filter(param => param.in === 'query');
    parameters.push(...queryParams);

    // Request body
    if (operation.requestBody) {
      const contentType = operation.requestBody.content && 
        (operation.requestBody.content['application/json'] || 
         Object.values(operation.requestBody.content)[0]);
      
      if (contentType && contentType.schema) {
        parameters.push({
          name: 'body',
          in: 'body',
          schema: contentType.schema,
          required: operation.requestBody.required || false,
          description: operation.requestBody.description || 'Request body'
        });
      }
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
   * Convert OpenAPI parameter to Zod schema
   * @param {object} parameter - OpenAPI parameter object
   * @returns {object} Zod schema
   */
  convertParameterToZod(parameter) {
    let zodSchema;

    // Handle parameter schema
    const paramSchema = parameter.schema || parameter;
    const type = paramSchema.type;
    const format = paramSchema.format;

    switch (type) {
      case 'string':
        zodSchema = z.string();
        if (paramSchema.enum) {
          zodSchema = z.enum(paramSchema.enum);
        }
        if (paramSchema.pattern) {
          zodSchema = zodSchema.regex(new RegExp(paramSchema.pattern));
        }
        if (paramSchema.minLength !== undefined) {
          zodSchema = zodSchema.min(paramSchema.minLength);
        }
        if (paramSchema.maxLength !== undefined) {
          zodSchema = zodSchema.max(paramSchema.maxLength);
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
        if (paramSchema.minimum !== undefined) {
          zodSchema = zodSchema.min(paramSchema.minimum);
        }
        if (paramSchema.maximum !== undefined) {
          zodSchema = zodSchema.max(paramSchema.maximum);
        }
        break;
      case 'boolean':
        zodSchema = z.boolean();
        break;
      case 'array':
        if (paramSchema.items) {
          const itemSchema = this.convertParameterToZod(paramSchema.items);
          zodSchema = z.array(itemSchema);
          if (paramSchema.minItems !== undefined) {
            zodSchema = zodSchema.min(paramSchema.minItems);
          }
          if (paramSchema.maxItems !== undefined) {
            zodSchema = zodSchema.max(paramSchema.maxItems);
          }
        } else {
          zodSchema = z.array(z.any());
        }
        break;
      case 'object':
        if (paramSchema.properties) {
          const shape = {};
          for (const [propName, propSchema] of Object.entries(paramSchema.properties)) {
            shape[propName] = this.convertParameterToZod(propSchema);
          }
          zodSchema = z.object(shape);
          
          // Handle required properties
          if (paramSchema.required && Array.isArray(paramSchema.required)) {
            const required = {};
            for (const reqProp of paramSchema.required) {
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

    // Handle nullable
    if (paramSchema.nullable) {
      zodSchema = zodSchema.nullable();
    }

    // Handle default value
    if (paramSchema.default !== undefined) {
      zodSchema = zodSchema.default(paramSchema.default);
    }

    // Handle required flag
    if (!parameter.required) {
      zodSchema = zodSchema.optional();
    }

    return zodSchema;
  }

  /**
   * Convert OpenAPI 3.0 schema to Zod schemas
   * @returns {object} Object with Zod schemas
   */
  convertToZodSchemas() {
    const zodSchemas = {};
    const components = this.schema.components || {};
    const schemas = components.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
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
   * Convert OpenAPI schema to Zod schema
   * @param {object} schema - OpenAPI schema
   * @returns {object} Zod schema
   */
  convertSchemaToZod(schema) {
    // Handle references
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      // Return a function that will be resolved later to avoid circular references
      return () => this.convertSchemaToZod(this.schema.components.schemas[refPath]);
    }

    // Handle allOf, oneOf, anyOf
    if (schema.allOf) {
      const schemas = schema.allOf.map(s => this.convertSchemaToZod(s));
      return z.intersection(...schemas);
    }

    if (schema.oneOf) {
      const schemas = schema.oneOf.map(s => this.convertSchemaToZod(s));
      return z.union(schemas);
    }

    if (schema.anyOf) {
      const schemas = schema.anyOf.map(s => this.convertSchemaToZod(s));
      return z.union(schemas);
    }

    // Handle basic types
    return this.convertParameterToZod(schema);
  }
}

module.exports = OpenApi3Converter;
