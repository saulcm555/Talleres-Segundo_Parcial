import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================
  // REST API Endpoints (para MCP)
  // ============================================

  /**
   * GET /products
   * Obtener todos los productos
   */
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * GET /products/search?q=query
   * Buscar productos por nombre
   */
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      return this.productsService.findAll();
    }
    return this.productsService.search(query);
  }

  /**
   * GET /products/:id
   * Obtener producto por ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  /**
   * GET /products/:id/stock?quantity=N
   * Validar stock disponible
   */
  @Get(':id/stock')
  async validateStock(
    @Param('id') id: string,
    @Query('quantity') quantity: string,
  ) {
    const qty = parseInt(quantity, 10) || 1;
    return this.productsService.validateStock(id, qty);
  }

  // ============================================
  // RabbitMQ Message Patterns (existente)
  // ============================================

  @MessagePattern('product.reserveStock')
  async reserveStock(data: { productId: string; quantity: number; idempotencyKey: string }) {
    const { productId, quantity, idempotencyKey } = data;
    return this.productsService.reserveStock(productId, quantity, idempotencyKey);
  }
}
