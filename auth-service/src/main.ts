import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';

/**
 * AUTH SERVICE - MICROSERVICIO DE AUTENTICACIÓN INDEPENDIENTE
 * 
 * Este servicio maneja exclusivamente:
 * - Registro de usuarios
 * - Login con JWT (access + refresh tokens)
 * - Logout y revocación de tokens
 * - Renovación de tokens
 * - Validación interna de tokens para otros servicios
 * 
 * Características de seguridad:
 * - Rate limiting en endpoints sensibles
 * - Blacklist de tokens revocados
 * - Validación local de JWT (sin llamadas al auth service en cada request)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('auth');

  // CORS habilitado para desarrollo
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      `
## Microservicio de Autenticación Independiente

Este servicio maneja toda la autenticación del sistema de estacionamiento.

### Características principales:
- **JWT con access y refresh tokens**: Access tokens de corta duración (15min), refresh tokens de larga duración (7 días)
- **Validación local**: Los demás servicios validan tokens localmente verificando firma y expiración
- **Rate limiting**: Protección contra ataques de fuerza bruta
- **Blacklist de tokens**: Tokens revocados se invalidan inmediatamente

### Endpoints:
- POST /auth/register - Registrar nuevo usuario
- POST /auth/login - Iniciar sesión
- POST /auth/logout - Cerrar sesión (revoca tokens)
- POST /auth/refresh - Renovar access token
- GET /auth/me - Obtener perfil del usuario actual
- GET /auth/validate - Validar token (uso interno entre servicios)
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingresa tu JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', 'Endpoints de autenticación')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🔐 AUTH SERVICE - MICROSERVICIO INICIADO             ║
╠═══════════════════════════════════════════════════════════════╣
║  Puerto:        ${port}                                           ║
║  Swagger UI:    http://localhost:${port}/api                      ║
║  Health Check:  http://localhost:${port}/auth/health              ║
╠═══════════════════════════════════════════════════════════════╣
║  ENDPOINTS PRINCIPALES:                                       ║
║  • POST /auth/register  - Registrar usuario                   ║
║  • POST /auth/login     - Iniciar sesión                      ║
║  • POST /auth/logout    - Cerrar sesión                       ║
║  • POST /auth/refresh   - Renovar token                       ║
║  • GET  /auth/me        - Perfil usuario                      ║
║  • GET  /auth/validate  - Validar token (interno)             ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
