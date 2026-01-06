/**
 * Tool: buscar_producto
 * Busca productos por nombre en el inventario
 */

import { ToolDefinition, ToolHandler, ToolCallResult } from '../types';
import { getBackendClient } from '../services';

export const buscarProductoDefinition: ToolDefinition = {
  name: 'buscar_producto',
  description: 'Busca productos por nombre o término de búsqueda en el inventario. Retorna una lista de productos que coinciden con la búsqueda.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Término de búsqueda (nombre del producto o parte del nombre)',
      },
    },
    required: ['query'],
  },
};

export const buscarProductoHandler: ToolHandler = async (args): Promise<ToolCallResult> => {
  const { query } = args as { query: string };

  console.log(`🔍 [buscar_producto] Buscando: "${query}"`);

  try {
    const backendClient = getBackendClient();
    const products = await backendClient.searchProducts(query);

    if (products.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No se encontraron productos que coincidan con "${query}".`,
          },
        ],
      };
    }

    const productList = products
      .map((p) => `- ${p.name} (ID: ${p.id}) - Precio: $${p.price} - Stock: ${p.stock} unidades`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Se encontraron ${products.length} producto(s):\n\n${productList}`,
        },
      ],
    };
  } catch (error: any) {
    console.error(`❌ [buscar_producto] Error:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: `Error al buscar productos: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
