import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para MCP Server
  app.enableCors();

  // Iniciar HTTP server primero (REST API)
  await app.listen(process.env.PORT ?? 3002);
  console.log('Orders Service running on port 3002 (REST API ready)');
}
bootstrap();
