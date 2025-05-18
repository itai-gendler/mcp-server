const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const SwaggerParser = require('@apidevtools/swagger-parser');
const https = require('https');
const http = require('http');

/**
 * Load an OpenAPI schema from a file
 * @param {string} filePath - Path to the OpenAPI schema file
 * @returns {Promise<object>} - Parsed OpenAPI schema
 */
async function loadOpenApiFromFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    
    // Determine if the file is JSON or YAML based on extension
    const ext = path.extname(filePath).toLowerCase();
    let parsedContent;
    
    if (ext === '.json') {
      parsedContent = JSON.parse(fileContent);
    } else if (ext === '.yaml' || ext === '.yml') {
      parsedContent = yaml.parse(fileContent);
    } else {
      throw new Error(`Unsupported file extension: ${ext}. Only .json, .yaml, and .yml are supported.`);
    }
    
    // Validate and normalize the OpenAPI schema
    const validatedSchema = await SwaggerParser.validate(parsedContent);
    return validatedSchema;
  } catch (error) {
    throw new Error(`Failed to load OpenAPI schema: ${error.message}`);
  }
}

/**
 * Load an OpenAPI schema from a URL
 * @param {string} url - URL to the OpenAPI schema
 * @returns {Promise<object>} - Parsed OpenAPI schema
 */
async function loadOpenApiFromUrl(url) {
  try {
    // Fetch content from URL
    const content = await fetchFromUrl(url);
    
    // Determine if the content is JSON or YAML based on content or URL extension
    let parsedContent;
    if (url.toLowerCase().endsWith('.json') || content.trim().startsWith('{')) {
      parsedContent = JSON.parse(content);
    } else {
      // Assume YAML otherwise
      parsedContent = yaml.parse(content);
    }
    
    // Validate and normalize the OpenAPI schema
    const validatedSchema = await SwaggerParser.validate(parsedContent);
    return validatedSchema;
  } catch (error) {
    throw new Error(`Failed to load OpenAPI schema from URL: ${error.message}`);
  }
}

/**
 * Fetch content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} - Content from URL
 */
function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP status code ${res.statusCode}`));
      }
      
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data).toString()));
    }).on('error', reject);
  });
}

/**
 * Detect the OpenAPI version from a schema
 * @param {object} schema - OpenAPI schema
 * @returns {string} - OpenAPI version (2.0, 3.0, or 3.1)
 */
function detectOpenApiVersion(schema) {
  if (schema.swagger === '2.0') {
    return '2.0';
  } else if (schema.openapi && schema.openapi.startsWith('3.0')) {
    return '3.0';
  } else if (schema.openapi && schema.openapi.startsWith('3.1')) {
    return '3.1';
  } else {
    throw new Error('Unsupported or undetected OpenAPI version');
  }
}

/**
 * Load OpenAPI schemas from a directory
 * @param {string} dirPath - Path to the directory containing OpenAPI schema files
 * @returns {Promise<Array<object>>} - Array of parsed OpenAPI schemas
 */
async function loadOpenApiFromDirectory(dirPath) {
  try {
    const fullPath = path.resolve(dirPath);
    
    // Check if the directory exists
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      throw new Error(`Directory does not exist or is not a directory: ${fullPath}`);
    }
    
    // Get all YAML files in the directory
    const files = fs.readdirSync(fullPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.yaml' || ext === '.yml';
      })
      .map(file => path.join(fullPath, file));
    
    if (files.length === 0) {
      throw new Error(`No YAML files found in directory: ${fullPath}`);
    }
    
    // Load each file and parse it
    const schemas = [];
    for (const file of files) {
      try {
        const schema = await loadOpenApiFromFile(file);
        schemas.push({
          filePath: file,
          schema
        });
      } catch (error) {
        console.warn(`Failed to load schema from ${file}: ${error.message}`);
      }
    }
    
    if (schemas.length === 0) {
      throw new Error(`No valid OpenAPI schemas found in directory: ${fullPath}`);
    }
    
    return schemas;
  } catch (error) {
    throw new Error(`Failed to load OpenAPI schemas from directory: ${error.message}`);
  }
}

module.exports = {
  loadOpenApiFromFile,
  loadOpenApiFromUrl,
  loadOpenApiFromDirectory,
  detectOpenApiVersion
};
