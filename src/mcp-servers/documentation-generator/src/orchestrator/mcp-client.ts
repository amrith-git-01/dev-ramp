/**
 * MCP Client for calling other MCP servers
 * 
 * Provides a client to communicate with code-analyzer and git-analyzer MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(serverName: string, config: MCPServerConfig): Promise<void> {
    try {
      const client = new Client(
        {
          name: `documentation-generator-client-${serverName}`,
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Create transport with proper environment handling
      const envVars: Record<string, string> = {};
      if (config.env) {
        Object.entries(config.env).forEach(([key, value]) => {
          if (value !== undefined) {
            envVars[key] = value;
          }
        });
      }

      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: envVars,
      });

      // Connect client to transport
      await client.connect(transport);

      this.clients.set(serverName, client);
      this.transports.set(serverName, transport);

      console.error(`Connected to ${serverName} MCP server`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to ${serverName}: ${errorMessage}`);
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName: string, toolName: string, args?: Record<string, unknown>): Promise<unknown> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName} server`);
    }

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args || {},
      }) as ToolCallResult;

      if (result.isError) {
        throw new Error(`Tool ${toolName} returned error: ${result.content[0]?.text || 'Unknown error'}`);
      }

      // Parse the JSON response
      if (result.content && result.content.length > 0 && result.content[0]) {
        const text = result.content[0].text;
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to call ${toolName} on ${serverName}: ${errorMessage}`);
    }
  }

  /**
   * List available tools on an MCP server
   */
  async listTools(serverName: string): Promise<unknown[]> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName} server`);
    }

    try {
      const result = await client.listTools();
      return result.tools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list tools on ${serverName}: ${errorMessage}`);
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client && transport) {
      try {
        await client.close();
        this.clients.delete(serverName);
        this.transports.delete(serverName);
        console.error(`Disconnected from ${serverName} MCP server`);
      } catch (error) {
        console.error(`Error disconnecting from ${serverName}:`, error);
      }
    }
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnectAll(): Promise<void> {
    const serverNames = Array.from(this.clients.keys());
    await Promise.all(serverNames.map(name => this.disconnect(name)));
  }

  /**
   * Check if connected to a server
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}

/**
 * Create and configure MCP client with default servers
 */
export async function createMCPClient(repoPath: string): Promise<MCPClient> {
  const client = new MCPClient();
  
  const nodeExecutable = process.execPath;
  const env = { REPO_PATH: repoPath };

  const serversDir = path.resolve(__dirname, '../../../..');

  // Connect to code-analyzer server
  try {
    await client.connect('code-analyzer', {
      command: nodeExecutable,
      args: [path.join(serversDir, 'code-analyzer/build/server.js')],
      env,
    });
  } catch (error) {
    console.error('Warning: Could not connect to code-analyzer server:', error);
  }

  // Connect to git-analyzer server
  try {
    await client.connect('git-analyzer', {
      command: nodeExecutable,
      args: [path.join(serversDir, 'git-analyzer/build/server.js')],
      env,
    });
  } catch (error) {
    console.error('Warning: Could not connect to git-analyzer server:', error);
  }

  return client;
}

// Made with Bob
