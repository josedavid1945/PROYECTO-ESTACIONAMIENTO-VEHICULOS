import { IsString, IsEmail, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdministradorDto {
  @ApiProperty({ description: 'Nombre del administrador', example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  nombre?: string;

  @ApiProperty({ description: 'Email del administrador', example: 'admin@estacionamiento.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Contraseña', example: 'NewPassword123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6)
  contrasena?: string;

  @ApiProperty({ description: 'Estado activo/inactivo', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}