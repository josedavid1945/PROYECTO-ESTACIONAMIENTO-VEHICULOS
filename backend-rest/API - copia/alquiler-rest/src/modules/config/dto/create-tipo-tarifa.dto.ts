import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTipoTarifaDto {
  @ApiProperty({ description: 'Tipo de tarifa', example: 'Estándar' })
  @IsString()
  @IsNotEmpty()
  tipoTarifa: string;

  @ApiProperty({ description: 'Precio por hora', example: 2.50 })
  @IsNumber()
  @IsNotEmpty()
  precioHora: number;

  @ApiProperty({ description: 'Precio por día', example: 20.00 })
  @IsNumber()
  @IsNotEmpty()
  precioDia: number;
}