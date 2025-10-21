import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTipoTarifaDto {
  @ApiProperty({ description: 'Tipo de tarifa', example: 'Estándar', required: false })
  @IsString()
  @IsOptional()
  tipoTarifa?: string;

  @ApiProperty({ description: 'Precio por hora', example: 2.50, required: false })
  @IsNumber()
  @IsOptional()
  precioHora?: number;

  @ApiProperty({ description: 'Precio por día', example: 20.00, required: false })
  @IsNumber()
  @IsOptional()
  precioDia?: number;
}