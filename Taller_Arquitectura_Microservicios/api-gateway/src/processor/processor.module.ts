import { Module } from '@nestjs/common';
import { ProcessorController } from './processor.controller';
import { ProcessorService } from './processor.service';
import { McpClientModule } from '../mcp-client';
import { GeminiModule } from '../gemini';

@Module({
  imports: [McpClientModule, GeminiModule],
  controllers: [ProcessorController],
  providers: [ProcessorService],
})
export class ProcessorModule {}
