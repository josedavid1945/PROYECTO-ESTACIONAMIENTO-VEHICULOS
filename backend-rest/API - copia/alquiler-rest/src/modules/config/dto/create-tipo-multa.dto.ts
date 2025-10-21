import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTipoMultaDto {
  @ApiProperty({ description: 'Nombre del tipo de multa', example: 'Exceso de tiempo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Monto base de la multa', example: 30.00 })
  @IsNumber()
  @IsNotEmpty()
  monto: number;
}