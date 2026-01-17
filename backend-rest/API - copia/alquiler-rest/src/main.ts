import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import "reflect-metadata";

/**
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN REST API
 * 
 * Configuraciones importantes:
 * 1. SIN prefijo global → Las rutas son directas (ej: /clientes)
 * 2. CORS habilitado → Permite peticiones desde el frontend y WebSocket
 * 3. Validación automática de DTOs → Valida datos de entrada
 * 4. Swagger → Documentación interactiva en /api
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  

  app.enableCors({
    origin: true, // Permite cualquier origen (para desarrollo)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true,   // Lanza error si hay propiedades extras
    transform: true,               // Transforma tipos automáticamente
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  /**
   * CONFIGURACIÓN 3: Swagger - Documentación interactiva
   * La documentación SI mantiene la ruta /api
   * pero las rutas de la API son directas
   */
  const config = new DocumentBuilder()
    .setTitle('API de Sistema de Estacionamiento')
    .setDescription('API REST para el sistema de gestión de estacionamiento')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  

}

bootstrap();