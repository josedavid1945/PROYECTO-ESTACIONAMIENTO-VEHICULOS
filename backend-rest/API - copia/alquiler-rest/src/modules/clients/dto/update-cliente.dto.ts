import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'María García', required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ description: 'Email del cliente', example: 'maria@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Teléfono del cliente', example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;
}