import { IsEmail, IsNotEmpty, IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para vincular cuenta de auth-service con cliente existente
 */
export class VincularCuentaDto {
  @ApiProperty({ 
    description: 'Email del cliente registrado por el administrador',
    example: 'juan.perez@email.com'
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({ 
    description: 'ID del usuario del auth-service (solo para desarrollo, en producción viene del JWT)',
    example: 'uuid-del-auth-service'
  })
  @IsUUID('4', { message: 'El authUserId debe ser un UUID válido' })
  @IsOptional()
  authUserId?: string;
}
