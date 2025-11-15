import { IsUUID, IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DesocuparEspacioDto {
  @ApiProperty({ description: 'ID del ticket activo', example: 'uuid-ticket' })
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @ApiProperty({ description: 'Método de pago', example: 'Efectivo' })
  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @ApiProperty({ description: 'Monto del pago', example: 15.50 })
  @IsNumber()
  @IsNotEmpty()
  montoPago: number;

  @ApiProperty({ description: 'ID del tipo de tarifa', example: 'uuid-tipo-tarifa' })
  @IsUUID()
  @IsNotEmpty()
  tipoTarifaId: string;
}
