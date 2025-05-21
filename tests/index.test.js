const path = require('path');
const { spawn } = require('child_process');

// Mock necessary modules before importing the module being tested
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    kill: jest.fn()
  }))
}));

jest.mock('../src/openapi-to-mcp', () => {
  return jest.fn().mockImplementation(() => ({
    loadFromDirectory: jest.fn().mockResolvedValue(undefined),
    generateMcpServerTools: jest.fn().mockResolvedValue(undefined)
  }));
});

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    registerTool: jest.fn()
  }))
}));

// Now import the module being tested after mocks are set up
const index = require('../index');

// Reference to the exported functionality we expect
const { launchServer, TransportType } = index;

describe('MCP Server Module', () => {
  // Save original values to restore
  const originalArgv = process.argv;
  const originalExit = process.exit;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.argv = [...originalArgv]; // Reset for each test
    
    // Mock console.error and process.exit for CLI tests
    process.exit = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;
    console.error = originalConsoleError;
  });
  
  describe('Module exports', () => {
    test('should export launchServer function', () => {
      expect(typeof index.launchServer).toBe('function');
    });
    
    test('should export TransportType enum', () => {
      expect(index.TransportType).toBeDefined();
      expect(index.TransportType.STDIO).toBe('stdio');
      expect(index.TransportType.SSE).toBe('sse');
      expect(index.TransportType.STREAMABLE).toBe('streamable');
    });
  });
  
  describe('launchServer function', () => {
    test('should launch server with default config', async () => {
      // Call launchServer with minimal arguments
      await launchServer(TransportType.STDIO, {
        // No options required for this test
      });
      
      // Minimal validation that the function executed without error
      expect(true).toBe(true);
    });
    
    test('should accept custom options', async () => {
      const customConfig = {
        openapiDir: '/custom/openapi/path',
        serverConfig: {
          name: 'Custom Server',
          version: '2.0.0'
        },
        apiOptions: {
          timeout: 5000,
          headers: { 'X-Test': 'value' }
        }
      };
      
      // Call launchServer with custom config
      await launchServer(TransportType.STDIO, customConfig);
      
      // Minimal validation that the function executed without error
      expect(true).toBe(true);
    });
  });
  
  describe('CLI functionality', () => {
    test('should export main CLI functionality', () => {
      // The main CLI functionality is when the module is executed directly
      // We just need to verify the launchServer function exists
      expect(typeof launchServer).toBe('function');
      
      // If we're here, it means the index.js module loaded without error
      // and the launchServer function was properly exported
      expect(true).toBe(true);
    });
    
    test('should handle transport types', () => {
      // Verify the TransportType enum contains expected values
      expect(TransportType.STDIO).toBe('stdio');
      expect(TransportType.SSE).toBe('sse');
      expect(TransportType.STREAMABLE).toBe('streamable');
    });
  });
});
