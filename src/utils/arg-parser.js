/**
 * Command line argument parser for MCP Server
 * Extracts common parameters like OpenAPI directory path
 */
const path = require('path');

/**
 * Parse command line arguments
 * @param {Array<string>} [args] - Command line arguments (defaults to process.argv.slice(2))
 * @param {object} [defaults] - Default values
 * @returns {object} Object containing parsed args
 */
function parseArgs(args = process.argv.slice(2), defaults = {}) {
  const result = {
    transportType: null,
    openapiDir: defaults.openapiDir || path.resolve(process.cwd(), 'openapi'),
    ...defaults
  };
  
  // Parse all arguments to find option flags
  let transportTypeSet = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Check for option flags
    if (arg === '--openapi-dir' && args[i + 1]) {
      result.openapiDir = path.resolve(process.cwd(), args[i + 1]);
      i++; // Skip the next argument as we've consumed it
    }
    // If it's not a flag and we haven't set the transport type yet, assume it's the transport type
    else if (!arg.startsWith('--') && !transportTypeSet) {
      result.transportType = arg.toLowerCase();
      transportTypeSet = true;
    }
  }
  
  return result;
}

module.exports = {
  parseArgs
};
