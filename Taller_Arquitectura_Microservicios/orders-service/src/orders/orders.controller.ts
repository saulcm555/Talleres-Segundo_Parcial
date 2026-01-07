import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================
  // REST API Endpoints (para MCP)
  // ============================================

  /**
   * GET /orders
   * Obtener todas las órdenes
   */
  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  /**
   * GET /orders/:id
   * Obtener orden por ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  /**
   * POST /orders
   * Crear una nueva orden
   */
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  // ============================================
  // RabbitMQ Message Patterns (existente)
  // ============================================

  @MessagePattern('orders.create')
  async createOrder(dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @MessagePattern('product.stockReserved')
  async handleStockReserved(data: {
    approved: boolean;
    productId: string;
    quantity: number;
    idempotencyKey: string;
    reason?: string;
  }) {
    return this.ordersService.handleStockReserved(data);
  }
}
