import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../users/entities/user.entity';

/**
 * Perfil de usuario
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  lastName: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Estado del usuario',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+51999888777',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Número de documento',
    example: '12345678',
  })
  documentNumber?: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Último inicio de sesión',
    example: '2024-01-20T08:15:00Z',
  })
  lastLogin?: Date;
}

/**
 * Respuesta de autenticación exitosa (login/register)
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token JWT de corta duración',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token JWT de larga duración',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tiempo de expiración del access token en segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: UserProfileDto;
}

/**
 * Respuesta de validación de token (para uso interno entre servicios)
 */
export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'Si el token es válido',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({
    description: 'Datos del usuario si el token es válido',
  })
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
  };

  @ApiPropertyOptional({
    description: 'Mensaje de error si el token no es válido',
    example: 'Token expired',
  })
  error?: string;
}

/**
 * Respuesta de logout
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Sesión cerrada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'Número de tokens revocados',
    example: 1,
  })
  tokensRevoked: number;
}

/**
 * Respuesta de refresh token
 */
export class RefreshResponseDto {
  @ApiProperty({
    description: 'Nuevo access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Nuevo refresh token (rotación de tokens)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 900,
  })
  expiresIn: number;
}
