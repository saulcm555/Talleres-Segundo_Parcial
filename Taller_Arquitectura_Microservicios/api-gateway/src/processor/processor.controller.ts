import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { ProcessorService, ProcessResult } from './processor.service';
import { ProcessRequestDto } from './dto/process-request.dto';

@Controller('api')
export class ProcessorController {
  private readonly logger = new Logger(ProcessorController.name);

  constructor(private readonly processorService: ProcessorService) {}

  /**
   * POST /api/procesar
   * Endpoint principal para procesar solicitudes con IA
   * 
   * Ejemplo de uso:
   * {
   *   "message": "Quiero crear una orden de 5 laptops",
   *   "context": "Usuario VIP" // opcional
   * }
   */
  @Post('procesar')
  async processRequest(@Body() dto: ProcessRequestDto): Promise<ProcessResult> {
    this.logger.log(`Received request: ${dto.message}`);
    return this.processorService.processRequest(dto.message, dto.context);
  }

  /**
   * GET /api/tools
   * Obtiene la lista de Tools disponibles
   */
  @Get('tools')
  async getTools() {
    const tools = await this.processorService.getAvailableTools();
    return {
      count: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema.required,
      })),
    };
  }

  /**
   * GET /api/health
   * Health check del procesador
   */
  @Get('health')
  async healthCheck() {
    try {
      const tools = await this.processorService.getAvailableTools();
      return {
        status: 'ok',
        service: 'api-gateway-processor',
        mcpServer: 'connected',
        toolsAvailable: tools.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'degraded',
        service: 'api-gateway-processor',
        mcpServer: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
