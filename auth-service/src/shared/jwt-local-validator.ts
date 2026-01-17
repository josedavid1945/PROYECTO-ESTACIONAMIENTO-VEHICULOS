/**
 * LIBRERÍA DE VALIDACIÓN LOCAL DE JWT
 * 
 * Esta librería permite a otros microservicios validar tokens JWT
 * LOCALMENTE sin necesidad de consultar al Auth Service en cada request.
 * 
 * Esto es fundamental para evitar el antipatrón de llamadas constantes
 * al servicio de autenticación.
 * 
 * USO:
 * 1. Obtener el secreto JWT del Auth Service una vez al iniciar (vía /auth/validation-secret)
 * 2. Usar esta librería para validar tokens en cada request
 */

import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: string;
  jti: string;      // JWT ID único
  type: 'access' | 'refresh';
  iat: number;      // issued at
  exp: number;      // expiration
}

export interface ValidationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

export interface LocalValidatorConfig {
  accessTokenSecret: string;
  algorithm?: jwt.Algorithm;
  issuer?: string;
  audience?: string;
}

/**
 * Validador local de JWT para microservicios
 * 
 * Permite validar tokens sin llamar al Auth Service,
 * verificando únicamente la firma y la expiración del token.
 */
export class JwtLocalValidator {
  private config: LocalValidatorConfig;

  constructor(config: LocalValidatorConfig) {
    this.config = {
      algorithm: 'HS256',
      ...config,
    };
  }

  /**
   * Validar un access token localmente
   * 
   * @param token - Token JWT a validar
   * @returns Resultado de la validación con payload si es válido
   */
  validateAccessToken(token: string): ValidationResult {
    try {
      const payload = jwt.verify(token, this.config.accessTokenSecret, {
        algorithms: [this.config.algorithm!],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as JwtPayload;

      // Verificar que sea un access token
      if (payload.type !== 'access') {
        return {
          valid: false,
          error: 'Token no es de tipo access',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expirado',
        };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Token inválido: ' + error.message,
        };
      }
      return {
        valid: false,
        error: 'Error de validación desconocido',
      };
    }
  }

  /**
   * Decodificar token sin validar (útil para debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si un token está próximo a expirar
   * 
   * @param token - Token a verificar
   * @param thresholdSeconds - Segundos antes de expiración para considerar "próximo"
   */
  isTokenExpiringSoon(token: string, thresholdSeconds: number = 60): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return true;

    const expirationTime = payload.exp * 1000;
    const threshold = thresholdSeconds * 1000;
    return Date.now() > expirationTime - threshold;
  }
}

/**
 * Middleware Express/NestJS para validación local de JWT
 */
export function createJwtMiddleware(validator: JwtLocalValidator) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);
    const result = validator.validateAccessToken(token);

    if (!result.valid) {
      return res.status(401).json({ message: result.error });
    }

    // Agregar usuario al request
    req.user = {
      id: result.payload!.sub,
      email: result.payload!.email,
      role: result.payload!.role,
    };

    next();
  };
}

/**
 * Función helper para obtener el secreto del Auth Service
 * Se debe llamar UNA VEZ al iniciar el microservicio
 */
export async function fetchValidationSecret(
  authServiceUrl: string,
  serviceKey: string,
): Promise<{ secret: string; algorithm: string }> {
  const response = await fetch(`${authServiceUrl}/auth/validation-secret`, {
    headers: {
      'X-Service-Key': serviceKey,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el secreto de validación');
  }

  return response.json();
}

export default JwtLocalValidator;
