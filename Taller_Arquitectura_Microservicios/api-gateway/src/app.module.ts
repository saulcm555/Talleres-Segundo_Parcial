import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { McpClientModule } from './mcp-client';
import { GeminiModule } from './gemini';
import { ProcessorModule } from './processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OrdersModule,
    McpClientModule,
    GeminiModule,
    ProcessorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
