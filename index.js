/**
 * MCP Server Launcher
 * 
 * This script determines which transport to use based on command line arguments
 * and launches the appropriate server implementation.
 * 
 * Usage:
 *   node index.js <transport>
 *   
 * Where transport is one of:
 *   - stdio: Uses StdioServerTransport for stdin/stdout communication
 *   - sse: Uses SSEServerTransport for Server-Sent Events communication
 *   - streamable: Uses StreamableHTTPServerTransport for HTTP communication
 */

const { spawn } = require('child_process');
const path = require('path');

// Valid transport types
const VALID_TRANSPORTS = ['stdio', 'sse', 'streamable'];

// Get the transport type from command line arguments
function getTransportType() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(`Error: Transport type is required.\nUsage: node index.js <transport>\nValid transports: ${VALID_TRANSPORTS.join(', ')}`);
    process.exit(1);
  }
  
  const transportType = args[0].toLowerCase();
  
  if (!VALID_TRANSPORTS.includes(transportType)) {
    console.error(`Error: Invalid transport type '${transportType}'.\nValid transports: ${VALID_TRANSPORTS.join(', ')}`);
    process.exit(1);
  }
  
  return transportType;
}

// Map transport type to server script
function getServerScript(transportType) {
  switch (transportType) {
    case 'stdio':
      return path.resolve(__dirname, 'stdio.js');
    case 'sse':
      return path.resolve(__dirname, 'sse-server.js');
    case 'streamable':
      return path.resolve(__dirname, 'http-server.js');
    default:
      // This should never happen due to validation in getTransportType
      console.error(`Error: Unsupported transport type: ${transportType}`);
      process.exit(1);
  }
}

// Launch the appropriate server based on the transport type
function launchServer(transportType) {
  const serverScript = getServerScript(transportType);
  
  console.log(`Starting MCP server with ${transportType} transport...`);
  
  // Pass through all environment variables and command line arguments after the transport type
  const serverProcess = spawn('node', [serverScript, ...process.argv.slice(3)], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle server process events
  serverProcess.on('error', (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code} and signal ${signal}`);
      process.exit(code || 1);
    }
  });
  
  // Handle signals to gracefully shut down the server
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down...`);
      serverProcess.kill(signal);
    });
  });
}

// Main function
function main() {
  const transportType = getTransportType();
  launchServer(transportType);
}

// Run the main function
main();
