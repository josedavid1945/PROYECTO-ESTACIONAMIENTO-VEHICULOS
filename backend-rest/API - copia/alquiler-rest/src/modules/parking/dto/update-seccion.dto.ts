import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSeccionDto {
  @ApiProperty({ description: 'Letra identificadora de la sección', example: 'A', required: false })
  @IsString()
  @IsOptional()
  letraSeccion?: string;
}