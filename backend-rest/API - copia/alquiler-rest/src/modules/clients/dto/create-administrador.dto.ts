import { IsString, IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdministradorDto {
  @ApiProperty({ description: 'Nombre del administrador', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre: string;

  @ApiProperty({ description: 'Email del administrador', example: 'admin@estacionamiento.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Contraseña', example: 'Password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Estado activo/inactivo', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}