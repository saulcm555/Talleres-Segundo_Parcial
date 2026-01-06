/**
 * Tipos e interfaces para el protocolo MCP (Model Context Protocol)
 * Basado en JSON-RPC 2.0
 */

// ============================================
// JSON-RPC 2.0 Base Types
// ============================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================
// MCP Tool Types
// ============================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface JsonSchemaProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

// ============================================
// Tool Handler Type
// ============================================

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolCallResult>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

// ============================================
// JSON-RPC Error Codes
// ============================================

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
} as const;
