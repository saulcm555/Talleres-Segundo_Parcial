/**
 * Backend Client Service
 * Cliente HTTP para comunicarse con los microservicios backend (products, orders)
 */

import axios, { AxiosInstance } from 'axios';

export class BackendClient {
  private productsClient: AxiosInstance;
  private ordersClient: AxiosInstance;

  constructor() {
    const productsUrl = process.env.BACKEND_PRODUCTS_URL || 'http://localhost:3001';
    const ordersUrl = process.env.BACKEND_ORDERS_URL || 'http://localhost:3002';

    this.productsClient = axios.create({
      baseURL: productsUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.ordersClient = axios.create({
      baseURL: ordersUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Backend Client initialized:`);
    console.log(`   - Products Service: ${productsUrl}`);
    console.log(`   - Orders Service: ${ordersUrl}`);
  }

  // ============================================
  // Products Service Methods
  // ============================================

  /**
   * Obtener todos los productos
   */
  async getAllProducts(): Promise<Product[]> {
    const response = await this.productsClient.get('/products');
    return response.data;
  }

  /**
   * Buscar productos por nombre
   */
  async searchProducts(query: string): Promise<Product[]> {
    const response = await this.productsClient.get('/products/search', {
      params: { q: query },
    });
    return response.data;
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await this.productsClient.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Validar stock de un producto
   */
  async validateStock(productId: string, quantity: number): Promise<StockValidation> {
    const response = await this.productsClient.get(`/products/${productId}/stock`, {
      params: { quantity },
    });
    return response.data;
  }

  // ============================================
  // Orders Service Methods
  // ============================================

  /**
   * Crear una nueva orden
   */
  async createOrder(productId: string, quantity: number): Promise<Order> {
    const response = await this.ordersClient.post('/orders', {
      productId,
      quantity,
    });
    return response.data;
  }

  /**
   * Obtener todas las órdenes
   */
  async getAllOrders(): Promise<Order[]> {
    const response = await this.ordersClient.get('/orders');
    return response.data;
  }

  /**
   * Obtener orden por ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const response = await this.ordersClient.get(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// ============================================
// Types
// ============================================

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  idempotencyKey: string;
}

export interface StockValidation {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  message: string;
}

// Singleton instance
let backendClientInstance: BackendClient | null = null;

export function getBackendClient(): BackendClient {
  if (!backendClientInstance) {
    backendClientInstance = new BackendClient();
  }
  return backendClientInstance;
}
