import { IsNumber, IsNotEmpty, IsString } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';

export class CreatePagoDto {
  @ApiProperty({ description: 'Monto del pago', example: 45.50 })
  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicada', example: 'tarifa-001' })
  @IsString() 
  @IsNotEmpty()
  tipoTarifaId: string; 
}