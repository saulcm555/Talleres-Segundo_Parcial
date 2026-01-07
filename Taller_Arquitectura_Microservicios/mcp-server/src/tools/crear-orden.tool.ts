/**
 * Tool: crear_orden
 * Crea una nueva orden de compra para un producto
 */

import { ToolDefinition, ToolHandler, ToolCallResult } from '../types';
import { getBackendClient } from '../services';

export const crearOrdenDefinition: ToolDefinition = {
  name: 'crear_orden',
  description: 'Crea una nueva orden de compra para un producto específico. Se recomienda validar el stock antes de crear la orden.',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'ID único del producto a ordenar',
      },
      quantity: {
        type: 'number',
        description: 'Cantidad de unidades a ordenar',
      },
    },
    required: ['productId', 'quantity'],
  },
};

export const crearOrdenHandler: ToolHandler = async (args): Promise<ToolCallResult> => {
  const { productId, quantity } = args as { productId: string; quantity: number };

  console.log(`🛒 [crear_orden] Creando orden - Producto: ${productId}, Cantidad: ${quantity}`);

  try {
    const backendClient = getBackendClient();
    const order = await backendClient.createOrder(productId, quantity);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Orden creada exitosamente:\n\n` +
                `- ID de Orden: ${order.id}\n` +
                `- Producto ID: ${order.productId}\n` +
                `- Cantidad: ${order.quantity} unidades\n` +
                `- Estado: ${order.status}\n` +
                `- Clave de idempotencia: ${order.idempotencyKey}\n\n` +
                `La orden está siendo procesada. El estado cambiará a CONFIRMED o REJECTED según la disponibilidad de stock.`,
        },
      ],
    };
  } catch (error: any) {
    console.error(`❌ [crear_orden] Error:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: `Error al crear la orden: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
