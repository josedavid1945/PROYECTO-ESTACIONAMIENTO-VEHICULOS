import { IsNumber, IsOptional, IsString } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePagoDto {
  @ApiProperty({ description: 'Monto del pago', example: 45.50, required: false })
  @IsNumber()
  @IsOptional()
  monto?: number;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicada', example: 'tarifa-001', required: false })
  @IsString() 
  @IsOptional()
  tipoTarifaId?: string;
}