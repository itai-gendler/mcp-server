const BaseOpenApiConverter = require('../../src/converters/base-converter');

describe('Tool Name Generation', () => {
  let converter;

  beforeEach(() => {
    // Create a new converter instance
    converter = new BaseOpenApiConverter({});
  });

  test('should use operationId if available', () => {
    const path = '/api/person';
    const method = 'get';
    const operation = { operationId: 'getPersons' };

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('getPersons');
  });

  test('should remove common prefix "api" from path', () => {
    const path = '/api/person';
    const method = 'get';
    const operation = {};

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('get_person');
    expect(toolName).not.toContain('api');
  });

  test('should handle path parameters correctly', () => {
    const path = '/api/person/{id}';
    const method = 'get';
    const operation = {};

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('get_person_Byid');
    expect(toolName).not.toContain('api');
  });

  test('should handle nested paths correctly', () => {
    const path = '/api/person/{id}/address';
    const method = 'get';
    const operation = {};

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('get_person_Byid_address');
    expect(toolName).not.toContain('api');
  });

  test('should handle paths without common prefixes', () => {
    const path = '/person/{id}';
    const method = 'get';
    const operation = {};

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('get_person_Byid');
  });

  test('should handle root paths correctly', () => {
    const path = '/api';
    const method = 'get';
    const operation = {};

    const toolName = converter.generateToolName(path, method, operation);
    expect(toolName).toBe('get_root');
  });
});
