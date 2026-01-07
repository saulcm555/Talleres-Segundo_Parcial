import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, any>;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

@Injectable()
export class McpClientService implements OnModuleInit {
  private readonly logger = new Logger(McpClientService.name);
  private client: AxiosInstance;
  private requestId = 0;
  private cachedTools: Tool[] = [];

  constructor(private configService: ConfigService) {
    const mcpServerUrl = this.configService.get<string>('MCP_SERVER_URL', 'http://localhost:3004');
    
    this.client = axios.create({
      baseURL: mcpServerUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`MCP Client configured with server: ${mcpServerUrl}`);
  }

  async onModuleInit() {
    // Pre-cargar tools al iniciar
    try {
      await this.listTools();
      this.logger.log('MCP Client initialized and tools cached');
    } catch (error) {
      this.logger.warn('Could not connect to MCP Server on init, will retry on first request');
    }
  }

  /**
   * Envía una petición JSON-RPC al MCP Server
   */
  private async sendRpcRequest<T>(method: string, params?: Record<string, any>): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    this.logger.debug(`Sending RPC request: ${method}`, params);

    try {
      const response = await this.client.post<JsonRpcResponse<T>>('/rpc', request);
      
      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      return response.data.result as T;
    } catch (error) {
      this.logger.error(`RPC request failed: ${method}`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene la lista de Tools disponibles del MCP Server
   */
  async listTools(): Promise<Tool[]> {
    const result = await this.sendRpcRequest<{ tools: Tool[] }>('tools/list');
    this.cachedTools = result.tools;
    this.logger.log(`Loaded ${this.cachedTools.length} tools from MCP Server`);
    return this.cachedTools;
  }

  /**
   * Obtiene los tools cacheados (sin llamar al servidor)
   */
  getCachedTools(): Tool[] {
    return this.cachedTools;
  }

  /**
   * Ejecuta un Tool específico con los parámetros dados
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    this.logger.log(`Calling tool: ${name}`, args);
    
    const result = await this.sendRpcRequest<{ content: any[] }>('tools/call', {
      name,
      arguments: args,
    });

    // Extraer el resultado del formato MCP
    if (result.content && result.content.length > 0) {
      const textContent = result.content.find(c => c.type === 'text');
      if (textContent) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return textContent.text;
        }
      }
    }

    return result;
  }

  /**
   * Verifica el estado del MCP Server
   */
  async healthCheck(): Promise<{ status: string; tools: string[] }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}
