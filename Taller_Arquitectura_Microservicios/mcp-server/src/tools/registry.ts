/**
 * Tool Registry
 * Registro central de todas las herramientas (Tools) disponibles en el MCP Server
 */

import { ToolDefinition, ToolHandler, RegisteredTool } from '../types';

// Importar Tools
import { buscarProductoDefinition, buscarProductoHandler } from './buscar-producto.tool';
import { validarStockDefinition, validarStockHandler } from './validar-stock.tool';
import { crearOrdenDefinition, crearOrdenHandler } from './crear-orden.tool';

class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Registra los Tools por defecto del sistema
   */
  private registerDefaultTools(): void {
    // Tool 1: Búsqueda de productos
    this.register(buscarProductoDefinition, buscarProductoHandler);

    // Tool 2: Validación de stock
    this.register(validarStockDefinition, validarStockHandler);

    // Tool 3: Creación de órdenes
    this.register(crearOrdenDefinition, crearOrdenHandler);

    console.log(`📋 Tool Registry initialized with ${this.tools.size} tools:`);
    this.tools.forEach((tool, name) => {
      console.log(`   - ${name}: ${tool.definition.description.substring(0, 50)}...`);
    });
  }

  /**
   * Registra un nuevo Tool
   */
  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
  }

  /**
   * Obtiene la lista de definiciones de todos los Tools
   */
  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * Obtiene un Tool por nombre
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Verifica si existe un Tool
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Ejecuta un Tool por nombre
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<ReturnType<ToolHandler>> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.handler(args);
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
