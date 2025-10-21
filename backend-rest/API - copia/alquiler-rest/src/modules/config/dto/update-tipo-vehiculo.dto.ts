import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTipoVehiculoDto {
  @ApiProperty({ description: 'Categoría del vehículo', example: 'SUV', required: false })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'Descripción del tipo de vehículo', example: 'Vehículo utilitario deportivo', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicable', example: 'tarifa-001', required: false })
  @IsUUID()
  @IsOptional()
  tipoTarifaId?: string;
}