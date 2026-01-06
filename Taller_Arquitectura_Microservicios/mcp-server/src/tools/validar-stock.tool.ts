/**
 * Tool: validar_stock
 * Valida si hay suficiente stock disponible de un producto
 */

import { ToolDefinition, ToolHandler, ToolCallResult } from '../types';
import { getBackendClient } from '../services';

export const validarStockDefinition: ToolDefinition = {
  name: 'validar_stock',
  description: 'Valida si hay suficiente stock disponible de un producto para una cantidad específica. Útil antes de crear una orden.',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'ID único del producto a validar',
      },
      quantity: {
        type: 'number',
        description: 'Cantidad que se desea verificar',
      },
    },
    required: ['productId', 'quantity'],
  },
};

export const validarStockHandler: ToolHandler = async (args): Promise<ToolCallResult> => {
  const { productId, quantity } = args as { productId: string; quantity: number };

  console.log(`📦 [validar_stock] Validando producto ${productId}, cantidad: ${quantity}`);

  try {
    const backendClient = getBackendClient();
    const validation = await backendClient.validateStock(productId, quantity);

    const statusEmoji = validation.isAvailable ? '✅' : '❌';
    
    return {
      content: [
        {
          type: 'text',
          text: `${statusEmoji} Validación de Stock:\n\n` +
                `- Producto: ${validation.productName}\n` +
                `- ID: ${validation.productId}\n` +
                `- Stock disponible: ${validation.availableStock} unidades\n` +
                `- Cantidad solicitada: ${validation.requestedQuantity} unidades\n` +
                `- Disponible: ${validation.isAvailable ? 'SÍ' : 'NO'}\n` +
                `- Mensaje: ${validation.message}`,
        },
      ],
    };
  } catch (error: any) {
    console.error(`❌ [validar_stock] Error:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: `Error al validar stock: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
