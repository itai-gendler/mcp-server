const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const debug = require('debug')('mcp-server:openapi');

/**
 * Creates an HTTP server for the MCP server using Server-Sent Events (SSE)
 */
class SseHttpServer {
  /**
   * Create a new SSE HTTP server
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
    
    // Store SSE transports by session ID
    this.sseTransports = {};
    
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
    // Create a server instance to be shared across all connections
    let mcpServer = null;
    this.mcpServerFactory().then(server => {
      mcpServer = server;
    }).catch(error => {
      console.error('Failed to create MCP server:', error);
    });

    // Handle SSE connection requests
    this.app.get('/sse', async (req, res) => {
      try {
        if (!mcpServer) {
          mcpServer = await this.mcpServerFactory();
        }
        
        // Create SSE transport for this connection
        const transport = new SSEServerTransport('/messages', res);
        const sessionId = transport.sessionId;
        
        // Store the transport by session ID
        this.sseTransports[sessionId] = transport;
        
        // Clean up when the connection is closed
        res.on('close', () => {
          delete this.sseTransports[sessionId];
        });
        
        // Connect the transport to the MCP server
        // Note: connect() automatically calls start() for SSEServerTransport
        await mcpServer.connect(transport);
      } catch (error) {
        console.error('Error handling SSE connection:', error);
        if (!res.headersSent) {
          res.status(500).send('Error establishing SSE connection');
        }
      }
    });

    // Handle message requests from clients
    this.app.post('/messages', async (req, res) => {
      try {
        const sessionId = req.query.sessionId;
        
        if (!sessionId) {
          return res.status(400).send('Missing session ID');
        }
        
        const transport = this.sseTransports[sessionId];
        
        if (!transport) {
          return res.status(400).send('No active session found for the provided session ID');
        }
        
        // Handle the message using the associated transport
        
        debug('Received message body:', JSON.stringify(req.body, null, 2));
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error('Error handling message:', error);
        if (!res.headersSent) {
          res.status(500).send('Error processing message');
        }
      }
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
        console.log(`MCP SSE HTTP Server running at http://${this.host}:${this.port}`);
        console.log(`SSE endpoint available at http://${this.host}:${this.port}/sse`);
        console.log(`Messages endpoint available at http://${this.host}:${this.port}/messages`);
        resolve(this);
      });
    });
  }

  /**
   * Stop the HTTP server
   * @returns {Promise<void>}
   */
  async stop() {
    // Close all active SSE transports
    for (const sessionId in this.sseTransports) {
      const transport = this.sseTransports[sessionId];
      try {
        if (transport && typeof transport.close === 'function') {
          transport.close();
        }
      } catch (error) {
        console.error(`Error closing SSE transport ${sessionId}:`, error);
      }
    }
    
    // Clear the transports map
    this.sseTransports = {};
    
    // Close the HTTP server
    if (this.server) {
      return new Promise((resolve, reject) => {
        // Force close all connections
        this.server.close((err) => {
          if (err) {
            console.error('Error stopping server:', err);
            reject(err);
          } else {
            console.log('MCP SSE HTTP Server stopped');
            resolve();
          }
        });
        
        // Set a timeout to force exit if server doesn't close properly
        setTimeout(() => {
          console.log('Forcing server shutdown after timeout');
          resolve();
        }, 2000);
      });
    }
    return Promise.resolve();
  }
}

module.exports = SseHttpServer;
