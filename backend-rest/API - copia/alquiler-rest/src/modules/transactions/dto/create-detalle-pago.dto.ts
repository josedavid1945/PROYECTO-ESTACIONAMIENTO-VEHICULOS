import { IsString, IsNumber, IsDate, IsNotEmpty } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDetallePagoDto {
  @ApiProperty({ description: 'Método de pago', example: 'Tarjeta de crédito' })
  @IsString()
  @IsNotEmpty()
  metodo: string;

  @ApiProperty({ description: 'Fecha del pago', example: '2024-01-15T14:30:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaPago: Date;

  @ApiProperty({ description: 'Pago total', example: 75.50 })
  @IsNumber()
  @IsNotEmpty()
  pagoTotal: number;

  @ApiProperty({ description: 'ID del ticket asociado', example: 'tick-001' })
  @IsString()
  @IsNotEmpty()
  ticketId: string; 

  @ApiProperty({ description: 'ID del pago relacionado', example: 'pago-001' })
  @IsString()
  @IsNotEmpty()
  pagoId: string; 
}