/**
 * MCP Server
 * Servidor Express que implementa JSON-RPC 2.0 para el protocolo MCP
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  JsonRpcError,
  JSON_RPC_ERRORS,
  ToolCallParams 
} from './types';
import { toolRegistry } from './tools';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// Helper Functions
// ============================================

function createJsonRpcResponse(id: string | number, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function createJsonRpcError(id: string | number, error: JsonRpcError): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error,
  };
}

// ============================================
// JSON-RPC Method Handlers
// ============================================

/**
 * Handler para tools/list
 * Retorna la lista de Tools disponibles
 */
async function handleToolsList(id: string | number): Promise<JsonRpcResponse> {
  console.log('📋 [tools/list] Listando tools disponibles');
  
  const tools = toolRegistry.listTools();
  
  return createJsonRpcResponse(id, {
    tools: tools,
  });
}

/**
 * Handler para tools/call
 * Ejecuta un Tool específico
 */
async function handleToolsCall(id: string | number, params: ToolCallParams): Promise<JsonRpcResponse> {
  const { name, arguments: args } = params;
  
  console.log(`🔧 [tools/call] Ejecutando tool: ${name}`);
  console.log(`   Argumentos:`, JSON.stringify(args, null, 2));

  if (!toolRegistry.hasTool(name)) {
    return createJsonRpcError(id, {
      code: -32601,
      message: `Tool "${name}" not found`,
    });
  }

  try {
    const result = await toolRegistry.callTool(name, args || {});
    return createJsonRpcResponse(id, result);
  } catch (error: any) {
    console.error(`❌ [tools/call] Error ejecutando ${name}:`, error.message);
    return createJsonRpcError(id, {
      code: -32603,
      message: error.message,
    });
  }
}

/**
 * Handler para initialize
 * Inicializa la conexión MCP
 */
async function handleInitialize(id: string | number): Promise<JsonRpcResponse> {
  console.log('🚀 [initialize] Inicializando conexión MCP');
  
  return createJsonRpcResponse(id, {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo: {
      name: 'mcp-server-inventario',
      version: '1.0.0',
    },
  });
}

/**
 * Handler para ping
 * Health check del servidor
 */
async function handlePing(id: string | number): Promise<JsonRpcResponse> {
  return createJsonRpcResponse(id, { pong: true });
}

// ============================================
// Routes
// ============================================

/**
 * Endpoint principal JSON-RPC
 * POST /rpc
 */
app.post('/rpc', async (req: Request, res: Response) => {
  const request = req.body as JsonRpcRequest;

  // Validar estructura JSON-RPC
  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return res.json(createJsonRpcError(request.id || 0, JSON_RPC_ERRORS.INVALID_REQUEST));
  }

  if (!request.method) {
    return res.json(createJsonRpcError(request.id, JSON_RPC_ERRORS.INVALID_REQUEST));
  }

  console.log(`\n🔵 JSON-RPC Request: ${request.method}`);

  let response: JsonRpcResponse;

  try {
    switch (request.method) {
      case 'initialize':
        response = await handleInitialize(request.id);
        break;

      case 'tools/list':
        response = await handleToolsList(request.id);
        break;

      case 'tools/call':
        if (!request.params || !request.params.name) {
          response = createJsonRpcError(request.id, JSON_RPC_ERRORS.INVALID_PARAMS);
        } else {
          response = await handleToolsCall(request.id, request.params as unknown as ToolCallParams);
        }
        break;

      case 'ping':
        response = await handlePing(request.id);
        break;

      default:
        response = createJsonRpcError(request.id, JSON_RPC_ERRORS.METHOD_NOT_FOUND);
    }
  } catch (error: any) {
    console.error('❌ Error procesando request:', error);
    response = createJsonRpcError(request.id, {
      ...JSON_RPC_ERRORS.INTERNAL_ERROR,
      data: error.message,
    });
  }

  res.json(response);
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'mcp-server',
    timestamp: new Date().toISOString(),
    tools: toolRegistry.listTools().map(t => t.name),
  });
});

/**
 * Documentación de Tools
 * GET /tools
 */
app.get('/tools', (req: Request, res: Response) => {
  const tools = toolRegistry.listTools();
  res.json({
    count: tools.length,
    tools: tools,
  });
});

// ============================================
// Server Start
// ============================================

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🤖 MCP Server - Model Context Protocol');
  console.log('========================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 JSON-RPC endpoint: http://localhost:${PORT}/rpc`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Tools list: http://localhost:${PORT}/tools`);
  console.log('========================================\n');
});
