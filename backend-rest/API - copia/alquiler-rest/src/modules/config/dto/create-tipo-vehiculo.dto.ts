import { IsString, IsNotEmpty } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger';

export class CreateTipoVehiculoDto {
  @ApiProperty({ description: 'Categoría del vehículo', example: 'SUV' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ description: 'Descripción del tipo de vehículo', example: 'Vehículo utilitario deportivo' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicable', example: 'tarifa-001' })
  @IsString() 
  @IsNotEmpty()
  tipoTarifaId: string; 
}