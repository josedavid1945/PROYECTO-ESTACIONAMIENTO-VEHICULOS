import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeccionDto {
  @ApiProperty({ description: 'Letra identificadora de la sección', example: 'A' })
  @IsString()
  @IsNotEmpty()
  letraSeccion: string;
}