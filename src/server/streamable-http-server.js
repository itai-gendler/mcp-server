const express = require('express');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

/**
 * Creates a streamable HTTP server for the MCP server
 * This implementation follows the stateless approach
 */
class StreamableHttpServer {
  /**
   * Create a new streamable HTTP server
   * @param {object} options - Server options
   * @param {number} options.port - Port to listen on (default: 3000)
   * @param {string} options.host - Host to bind to (default: localhost)
   */
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.app = express();
    this.server = null;
    this.mcpServerFactory = null;
    
    // Configure middleware
    this.app.use(express.json());
  }

  /**
   * Set the MCP server factory function
   * @param {Function} factory - Async function that returns a configured MCP server instance
   */
  setMcpServerFactory(factory) {
    this.mcpServerFactory = factory;
    return this;
  }

  /**
   * Configure the Express routes for MCP
   */
  configureRoutes() {
    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req, res) => {
      try {
        // Create a new transport for this request
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // No session management
        });
        
        // In stateless mode, create a new instance of a fully configured server for each request
        // This ensures tools are registered BEFORE connecting to the transport
        const server = await this.mcpServerFactory();
        
        // Clean up when the request is closed
        res.on('close', () => {
          transport.close();
          server.close();
        });
        
        // Connect the server to the transport AFTER tools have been registered
        await server.connect(transport);
        
        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Handle GET requests (not supported in stateless mode)
    this.app.get('/mcp', async (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed in stateless mode.',
        },
        id: null,
      });
    });

    // Handle DELETE requests (not supported in stateless mode)
    this.app.delete('/mcp', async (req, res) => {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed in stateless mode.',
        },
        id: null,
      });
    });

    // Add a health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  /**
   * Start the HTTP server
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.mcpServerFactory) {
      throw new Error('MCP server factory must be set before starting the server');
    }
    
    // Configure routes
    this.configureRoutes();
    
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        console.log(`MCP Streamable HTTP Server running at http://${this.host}:${this.port}`);
        console.log(`MCP endpoint available at http://${this.host}:${this.port}/mcp`);
        resolve(this);
      });
    });
  }

  /**
   * Stop the HTTP server
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('MCP Streamable HTTP Server stopped');
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }
}

module.exports = StreamableHttpServer;
