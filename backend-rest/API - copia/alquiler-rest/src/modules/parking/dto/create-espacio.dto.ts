import { IsString, IsBoolean, IsNotEmpty } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger';

export class CreateEspacioDto {
  @ApiProperty({ description: 'Número del espacio', example: '101' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ description: 'Estado del espacio (disponible/ocupado)', example: true })
  @IsBoolean()
  @IsNotEmpty()
  estado: boolean;

  @ApiProperty({ description: 'ID de la sección a la que pertenece', example: 'sec-001' })
  @IsString() 
  @IsNotEmpty()
  seccionId: string; 
}