const path = require('path');
const { parseArgs } = require('../../src/utils/arg-parser');

describe('Argument Parser Utility', () => {
  const cwd = process.cwd();
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should return default values when no arguments provided', () => {
    const args = [];
    const result = parseArgs(args);
    
    expect(result).toEqual({
      transportType: null,
      openapiDir: path.resolve(cwd, 'openapi')
    });
  });
  
  test('should override defaults with provided values', () => {
    const args = [];
    const defaults = {
      openapiDir: '/custom/default/path',
      customOption: 'value'
    };
    
    const result = parseArgs(args, defaults);
    
    expect(result).toEqual({
      transportType: null,
      openapiDir: '/custom/default/path',
      customOption: 'value'
    });
  });
  
  test('should extract transport type from first argument', () => {
    const args = ['stdio'];
    const result = parseArgs(args);
    
    expect(result.transportType).toBe('stdio');
  });
  
  test('should convert transport type to lowercase', () => {
    const args = ['STDIO'];
    const result = parseArgs(args);
    
    expect(result.transportType).toBe('stdio');
  });
  
  test('should parse --openapi-dir argument', () => {
    const args = ['stdio', '--openapi-dir', '/custom/openapi/path'];
    const result = parseArgs(args);
    
    expect(result.openapiDir).toBe(path.resolve(cwd, '/custom/openapi/path'));
  });
  
  test('should handle --openapi-dir as the first argument', () => {
    const args = ['--openapi-dir', '/custom/openapi/path', 'stdio'];
    const result = parseArgs(args);
    
    expect(result.openapiDir).toBe(path.resolve(cwd, '/custom/openapi/path'));
    expect(result.transportType).toBe('stdio');
  });
  
  test('should handle missing value for --openapi-dir', () => {
    const args = ['stdio', '--openapi-dir'];
    const result = parseArgs(args);
    
    // Should use default since no value was provided
    expect(result.openapiDir).toBe(path.resolve(cwd, 'openapi'));
  });
  
  test('should skip processing of consumed --openapi-dir value', () => {
    const args = ['stdio', '--openapi-dir', '/custom/path', '--another-flag'];
    const result = parseArgs(args);
    
    expect(result.openapiDir).toBe(path.resolve(cwd, '/custom/path'));
    // Ensure we correctly skipped the path value and moved to the next argument
    expect(result.transportType).toBe('stdio');
  });
});
