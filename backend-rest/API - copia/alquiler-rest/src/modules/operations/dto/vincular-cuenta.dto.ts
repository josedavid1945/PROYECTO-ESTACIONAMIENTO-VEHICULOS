import { IsEmail, IsNotEmpty, IsOptional, IsUUID, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para vincular cuenta de auth-service con cliente existente
 * Se puede vincular por email O por clienteId
 */
export class VincularCuentaDto {
  @ApiPropertyOptional({ 
    description: 'Email del cliente registrado por el administrador',
    example: 'juan.perez@email.com'
  })
  @ValidateIf(o => !o.clienteId) // Solo requerido si no hay clienteId
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @ApiPropertyOptional({ 
    description: 'ID del cliente para vinculación directa (usado internamente por auth-service)',
    example: 'uuid-del-cliente'
  })
  @ValidateIf(o => !o.email) // Solo requerido si no hay email
  @IsUUID('4', { message: 'El clienteId debe ser un UUID válido' })
  clienteId?: string;

  @ApiPropertyOptional({ 
    description: 'ID del usuario del auth-service (solo para desarrollo, en producción viene del JWT)',
    example: 'uuid-del-auth-service'
  })
  @IsUUID('4', { message: 'El authUserId debe ser un UUID válido' })
  @IsOptional()
  authUserId?: string;
}
