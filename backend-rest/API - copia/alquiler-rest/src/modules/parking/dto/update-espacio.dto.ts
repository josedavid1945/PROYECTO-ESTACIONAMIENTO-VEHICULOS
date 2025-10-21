import { IsString, IsBoolean, IsOptional } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEspacioDto {
  @ApiProperty({ description: 'Número del espacio', example: '101', required: false })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({ description: 'Estado del espacio (disponible/ocupado)', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @ApiProperty({ description: 'ID de la sección a la que pertenece', example: 'sec-001', required: false })
  @IsString() 
  @IsOptional()
  seccionId?: string;
}