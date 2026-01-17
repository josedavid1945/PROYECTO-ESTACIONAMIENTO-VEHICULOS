import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { RegisterDto, LoginDto, LogoutDto, RefreshTokenDto } from './dto/auth.dto';
import {
  AuthResponseDto,
  UserProfileDto,
  ValidateTokenResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  /**
   * Registrar nuevo usuario
   */
  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Registro de nuevo usuario: ${registerDto.email}`);

    // Crear usuario
    const user = await this.usersService.create(registerDto);

    // Generar tokens
    const tokens = await this.tokensService.generateTokenPair(
      user,
      'web',
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
      user: this.mapUserToProfile(user),
    };
  }

  /**
   * Iniciar sesión
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Intento de login fallido - usuario no existe: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si puede hacer login
    const canLoginResult = this.usersService.canLogin(user);
    if (!canLoginResult.canLogin) {
      this.logger.warn(`Login bloqueado para ${email}: ${canLoginResult.reason}`);
      throw new UnauthorizedException(canLoginResult.reason);
    }

    // Verificar contraseña
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      await this.usersService.recordFailedLogin(user);
      this.logger.warn(`Contraseña incorrecta para: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login exitoso
    await this.usersService.recordSuccessfulLogin(user);
    this.logger.log(`Login exitoso: ${email}`);

    // Generar tokens
    const tokens = await this.tokensService.generateTokenPair(
      user,
      'web',
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
      user: this.mapUserToProfile(user),
    };
  }

  /**
   * Cerrar sesión (logout)
   * Ahora funciona sin userId obligatorio - usa el refresh_token para identificar la sesión
   */
  async logout(
    accessToken: string,
    logoutDto: LogoutDto,
    userId?: string,
  ): Promise<LogoutResponseDto> {
    let tokensRevoked = 0;

    // Obtener payload del access token actual y agregarlo a blacklist
    if (accessToken) {
      try {
        const payload = await this.tokensService.verifyAccessToken(accessToken);
        await this.tokensService.blacklistAccessToken(payload);
        tokensRevoked++;
        // Si no tenemos userId, lo extraemos del token
        if (!userId) {
          userId = payload.sub;
        }
      } catch (error) {
        // Si el token ya expiró, intentar extraer el userId del payload decodificado
        this.logger.debug('Access token ya expirado o inválido en logout');
      }
    }

    // Si se quiere cerrar sesión en todos los dispositivos y tenemos userId
    if (logoutDto.allDevices && userId) {
      // Revocar todos los refresh tokens del usuario
      const revokedCount = await this.tokensService.revokeAllUserTokens(
        userId,
        'Logout de todos los dispositivos',
      );
      tokensRevoked += revokedCount;
      this.logger.log(`Logout de todos los dispositivos para usuario ${userId}: ${revokedCount} tokens revocados`);
    } else if (logoutDto.refreshToken) {
      // Revocar solo el refresh token específico
      try {
        await this.tokensService.revokeRefreshToken(logoutDto.refreshToken, 'Logout');
        tokensRevoked++;
      } catch (error) {
        this.logger.debug('Refresh token ya revocado o inválido');
      }
    }

    return {
      message: logoutDto.allDevices 
        ? 'Sesión cerrada en todos los dispositivos' 
        : 'Sesión cerrada exitosamente',
      tokensRevoked,
    };
  }

  /**
   * Renovar tokens usando refresh token
   */
  async refresh(
    refreshTokenDto: RefreshTokenDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verificar refresh token
    const payload = await this.tokensService.verifyRefreshToken(refreshToken);

    // Obtener usuario
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar estado del usuario
    const canLoginResult = this.usersService.canLogin(user);
    if (!canLoginResult.canLogin) {
      throw new UnauthorizedException(canLoginResult.reason);
    }

    // Rotar tokens (genera nuevos y revoca el anterior)
    const tokens = await this.tokensService.rotateRefreshToken(
      refreshToken,
      user,
      'web',
      ipAddress,
      userAgent,
    );

    this.logger.log(`Tokens renovados para usuario: ${user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.usersService.findByIdOrFail(userId);
    return this.mapUserToProfile(user);
  }

  /**
   * Validar token (endpoint interno para otros servicios)
   */
  async validateToken(accessToken: string): Promise<ValidateTokenResponseDto> {
    try {
      const payload = await this.tokensService.verifyAccessToken(accessToken);
      
      // Obtener datos básicos del usuario
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        return { valid: false, error: 'Usuario no encontrado' };
      }

      // Verificar estado del usuario
      const canLoginResult = this.usersService.canLogin(user);
      if (!canLoginResult.canLogin) {
        return { valid: false, error: canLoginResult.reason };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token inválido',
      };
    }
  }

  /**
   * Obtener información para validación local (para otros servicios)
   * NOTA: Este endpoint debe estar protegido y solo accesible desde la red interna
   */
  getValidationSecret(serviceKey: string): { secret: string; algorithm: string } {
    const expectedKey = process.env.INTERNAL_SERVICE_KEY;
    if (serviceKey !== expectedKey) {
      throw new UnauthorizedException('Clave de servicio inválida');
    }
    return this.tokensService.getValidationInfo();
  }

  /**
   * Mapear entidad User a DTO de perfil
   */
  private mapUserToProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      documentNumber: user.documentNumber,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }
}
