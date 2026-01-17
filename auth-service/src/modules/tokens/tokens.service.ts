import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: string;
  jti: string;      // JWT ID único
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokensService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    this.accessTokenExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    this.refreshTokenExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  /**
   * Generar par de tokens (access + refresh)
   */
  async generateTokenPair(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    // Generar Access Token (corta duración)
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: accessJti,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiration,
    });

    // Generar Refresh Token (larga duración)
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: refreshJti,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiration,
    });

    // Calcular fecha de expiración del refresh token
    const refreshExpiration = this.calculateExpiration(this.refreshTokenExpiration);

    // Guardar refresh token en la base de datos
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiration,
      deviceInfo,
      ipAddress,
      userAgent,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Calcular expiresIn en segundos para el access token
    const expiresIn = this.calculateExpiresInSeconds(this.accessTokenExpiration);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verificar y decodificar access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.accessTokenSecret,
      });

      // Verificar si el token está en la blacklist
      const isRevoked = await this.isTokenRevoked(payload.jti);
      if (isRevoked) {
        throw new UnauthorizedException('Token revocado');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Verificar y decodificar refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.refreshTokenSecret,
      });

      // Verificar en la base de datos
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token },
      });

      if (!storedToken || !storedToken.isValid()) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  /**
   * Rotar refresh token (generar nuevo par y revocar el antiguo)
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // Revocar el refresh token anterior
    await this.revokeRefreshToken(oldRefreshToken, 'Token rotado');

    // Generar nuevo par de tokens
    return this.generateTokenPair(user, deviceInfo, ipAddress, userAgent);
  }

  /**
   * Revocar un refresh token específico
   */
  async revokeRefreshToken(token: string, reason?: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (storedToken) {
      storedToken.revoke(reason);
      await this.refreshTokenRepository.save(storedToken);
    }
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: string, reason?: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { 
        isRevoked: true, 
        revokedAt: new Date(),
        revokedReason: reason || 'Logout de todos los dispositivos',
      },
    );
    return result.affected || 0;
  }

  /**
   * Agregar token a la blacklist (para access tokens)
   */
  async blacklistAccessToken(payload: JwtPayload): Promise<void> {
    // Calcular fecha de expiración desde el token
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.calculateExpiresInSeconds(this.accessTokenExpiration) / 60);

    const revokedToken = this.revokedTokenRepository.create({
      jti: payload.jti,
      tokenType: 'access',
      userId: payload.sub,
      expiresAt,
      revokedReason: 'Logout',
    });

    await this.revokedTokenRepository.save(revokedToken);
  }

  /**
   * Verificar si un token está en la blacklist
   */
  async isTokenRevoked(jti: string): Promise<boolean> {
    const revokedToken = await this.revokedTokenRepository.findOne({
      where: { jti },
    });
    return !!revokedToken;
  }

  /**
   * Limpiar tokens expirados (ejecutar periódicamente)
   */
  async cleanupExpiredTokens(): Promise<{ refreshTokens: number; revokedTokens: number }> {
    const now = new Date();

    // Eliminar refresh tokens expirados
    const refreshResult = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    // Eliminar registros de blacklist expirados
    const revokedResult = await this.revokedTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    return {
      refreshTokens: refreshResult.affected || 0,
      revokedTokens: revokedResult.affected || 0,
    };
  }

  /**
   * Obtener información para validación local (clave pública/secreta para otros servicios)
   */
  getValidationInfo(): { secret: string; algorithm: string } {
    return {
      secret: this.accessTokenSecret,
      algorithm: 'HS256',
    };
  }

  /**
   * Calcular fecha de expiración a partir de string (ej: "15m", "7d")
   */
  private calculateExpiration(expirationString: string): Date {
    const match = expirationString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000); // Default 15 minutos
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }

  /**
   * Calcular expiración en segundos
   */
  private calculateExpiresInSeconds(expirationString: string): number {
    const match = expirationString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutos
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
