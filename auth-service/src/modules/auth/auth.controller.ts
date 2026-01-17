import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto, LoginDto, LogoutDto, RefreshTokenDto } from './dto/auth.dto';
import {
  AuthResponseDto,
  UserProfileDto,
  ValidateTokenResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registrar un nuevo usuario en el sistema
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 registros por minuto
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario y devuelve tokens de autenticación',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes - Rate limit excedido' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  /**
   * POST /auth/login
   * Iniciar sesión con email y contraseña
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Máximo 10 intentos por minuto
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y devuelve access token y refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta bloqueada' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de login' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  /**
   * POST /auth/logout
   * Cerrar sesión y revocar tokens
   * Endpoint público - no requiere autenticación obligatoria
   * Usa el refresh_token del body para identificar la sesión
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca el refresh token proporcionado. El access token se puede enviar opcionalmente para blacklistearlo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Refresh token requerido' })
  async logout(
    @Body() logoutDto: LogoutDto,
    @Headers('authorization') authHeader: string,
  ): Promise<LogoutResponseDto> {
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    return this.authService.logout(accessToken, logoutDto);
  }

  /**
   * POST /auth/refresh
   * Renovar access token usando refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Máximo 30 renovaciones por minuto
  @ApiOperation({
    summary: 'Renovar token',
    description: 'Genera un nuevo access token usando el refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados exitosamente',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<RefreshResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(refreshTokenDto, ipAddress, userAgent);
  }

  /**
   * GET /auth/me
   * Obtener perfil del usuario autenticado
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Obtener perfil',
    description: 'Devuelve la información del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@CurrentUser('id') userId: string): Promise<UserProfileDto> {
    return this.authService.getProfile(userId);
  }

  /**
   * GET /auth/validate
   * Validar token (endpoint interno para otros servicios)
   * 
   * Este endpoint permite que otros microservicios validen tokens
   * sin tener que implementar toda la lógica de verificación
   */
  @Get('validate')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Validar token (interno)',
    description: 'Endpoint interno para que otros servicios validen tokens',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token a validar',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de validación',
    type: ValidateTokenResponseDto,
  })
  async validateToken(
    @Headers('authorization') authHeader: string,
  ): Promise<ValidateTokenResponseDto> {
    const token = authHeader?.replace('Bearer ', '') || '';
    if (!token) {
      return { valid: false, error: 'Token no proporcionado' };
    }
    return this.authService.validateToken(token);
  }

  /**
   * GET /auth/validation-secret
   * Obtener secreto para validación local (solo servicios internos)
   * 
   * NOTA: Este endpoint devuelve el secreto JWT para que otros servicios
   * puedan validar tokens LOCALMENTE sin llamar al auth service.
   * Debe estar protegido y solo accesible desde la red interna.
   */
  @Get('validation-secret')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Obtener secreto de validación (interno)',
    description: 'Devuelve el secreto JWT para validación local. Solo accesible con clave de servicio.',
  })
  @ApiHeader({
    name: 'X-Service-Key',
    description: 'Clave de servicio interno',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Secreto de validación',
  })
  @ApiResponse({ status: 401, description: 'Clave de servicio inválida' })
  getValidationSecret(
    @Headers('x-service-key') serviceKey: string,
  ): { secret: string; algorithm: string } {
    return this.authService.getValidationSecret(serviceKey);
  }
}
