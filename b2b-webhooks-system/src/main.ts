import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:4200', 
      'http://localhost:3000',
      'https://parking-frontend-g7vl.onrender.com',
      /\.onrender\.com$/
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('B2B Webhooks System - Estacionamiento')
    .setDescription(`
      Sistema de integración B2B con webhooks y chatbot MCP multimodal.
      
      ## Características:
      - Registro de partners con credenciales HMAC
      - Sistema de webhooks bidireccional
      - Motor de eventos con reintentos
      - Chatbot MCP con Gemini AI
      - Procesamiento multimodal (texto, imágenes, PDF)
      
      ## Eventos soportados:
      - parking.reserved
      - parking.entered
      - parking.exited
      - payment.success
      - payment.failed
      - space.updated
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addTag('Partners', 'Gestión de partners B2B')
    .addTag('Webhooks', 'Sistema de webhooks')
    .addTag('Payments', 'Procesamiento de pagos')
    .addTag('MCP', 'Chatbot MCP multimodal')
    .addTag('Events', 'Motor de eventos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║       🚀 B2B WEBHOOKS SYSTEM - ESTACIONAMIENTO               ║
╠══════════════════════════════════════════════════════════════╣
║  API REST:     http://localhost:${port}                        ║
║  Swagger:      http://localhost:${port}/api                    ║
║  WebSocket:    ws://localhost:${process.env.WS_PORT || 3002}                       ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints principales:                                      ║
║  • POST /partners/register    - Registrar partner            ║
║  • POST /webhooks/receive     - Recibir webhooks             ║
║  • POST /mcp/chat             - Chat con IA                  ║
║  • GET  /events/monitor       - Dashboard de eventos         ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
