/**
 * EJEMPLO DE INTEGRACIÓN - Auth Guard para REST API
 * 
 * Este archivo muestra cómo integrar la validación local de JWT
 * en el servicio REST API existente, evitando llamadas al Auth Service.
 * 
 * INSTRUCCIONES DE USO:
 * 1. Copiar este archivo a: backend-rest/API - copia/alquiler-rest/src/common/guards/
 * 2. Importar en app.module.ts
 * 3. Usar @UseGuards(JwtLocalAuthGuard) en los controladores protegidos
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * Guard de autenticación JWT con validación LOCAL
 * 
 * NO llama al Auth Service en cada request.
 * Valida firma y expiración del token localmente.
 */
@Injectable()
export class JwtLocalAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtLocalAuthGuard.name);
  private jwtSecret: string | undefined = undefined;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Intentar obtener el secreto del Auth Service al iniciar
    await this.fetchSecretFromAuthService();
  }

  /**
   * Obtener el secreto JWT del Auth Service (una sola vez al iniciar)
   */
  private async fetchSecretFromAuthService(): Promise<void> {
    const authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
    const serviceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
      'internal-service-key-2024',
    );

    try {
      const response = await fetch(`${authServiceUrl}/auth/validation-secret`, {
        headers: {
          'X-Service-Key': serviceKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.jwtSecret = data.secret;
        this.logger.log('✅ Secreto JWT obtenido del Auth Service');
      } else {
        // Fallback: usar secreto de configuración local
        this.jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET') ?? undefined;
        this.logger.warn(
          '⚠️ No se pudo conectar al Auth Service, usando secreto local',
        );
      }
    } catch (error) {
      // Fallback: usar secreto de configuración local
      this.jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET') ?? undefined;
      this.logger.warn(
        '⚠️ Error al conectar con Auth Service, usando secreto local',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.substring(7);

    if (!this.jwtSecret) {
      throw new UnauthorizedException(
        'Servicio de autenticación no configurado',
      );
    }

    try {
      // Validación LOCAL del token (sin llamar al Auth Service)
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as JwtPayload;

      // Verificar tipo de token
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      // Agregar usuario al request
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token inválido');
      }
      throw new UnauthorizedException('Error de autenticación');
    }
  }
}

/**
 * Decorador para marcar endpoints como públicos
 */
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorador para obtener el usuario actual
 */
import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Guard de roles
 */
import { Reflector } from '@nestjs/core';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
