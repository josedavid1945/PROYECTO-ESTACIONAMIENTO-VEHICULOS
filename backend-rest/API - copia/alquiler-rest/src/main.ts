import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import "reflect-metadata";

/**
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN REST API
 * 
 * Configuraciones importantes:
 * 1. Prefijo global 'api' → Todas las rutas comienzan con /api
 * 2. CORS habilitado → Permite peticiones desde el frontend y WebSocket
 * 3. Validación automática de DTOs → Valida datos de entrada
 * 4. Swagger → Documentación interactiva en /api
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  /**
   * CONFIGURACIÓN 1: Prefijo Global
   * Todas las rutas tendrán el prefijo /api
   * Ejemplo: /tickets → /api/tickets
   */
  app.setGlobalPrefix('api');
  
  /**
   * CONFIGURACIÓN 2: CORS (Cross-Origin Resource Sharing)
   * MODIFICACIÓN: Configurado para permitir peticiones desde:
   * - Frontend (http://localhost:8080)
   * - WebSocket Server (localhost:8081)
   * - Navegadores en general
   * 
   * Esto es CRÍTICO para que el WebSocket Server en Go pueda
   * consultar los endpoints del REST API
   */
  app.enableCors({
    origin: true, // Permite cualquier origen (para desarrollo)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  /**
   * CONFIGURACIÓN 3: Validación Global de DTOs
   * Valida automáticamente todos los datos de entrada usando
   * los decoradores de class-validator en los DTOs
   */
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true,   // Lanza error si hay propiedades extras
    transform: true,               // Transforma tipos automáticamente
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Configuración de Swagger
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
  
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/api`);
}

bootstrap();