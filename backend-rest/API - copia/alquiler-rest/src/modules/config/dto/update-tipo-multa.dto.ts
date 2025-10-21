import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTipoMultaDto {
  @ApiProperty({ description: 'Nombre del tipo de multa', example: 'Exceso de tiempo', required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ description: 'Monto base de la multa', example: 30.00, required: false })
  @IsNumber()
  @IsOptional()
  monto?: number;
}