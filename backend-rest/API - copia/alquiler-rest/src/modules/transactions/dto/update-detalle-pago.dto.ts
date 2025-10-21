import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDetallePagoDto {
  @ApiProperty({ description: 'Método de pago', example: 'Tarjeta de crédito', required: false })
  @IsString()
  @IsOptional()
  metodo?: string;

  @ApiProperty({ description: 'Fecha del pago', example: '2024-01-15T14:30:00Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaPago?: Date;

  @ApiProperty({ description: 'Pago total', example: 75.50, required: false })
  @IsNumber()
  @IsOptional()
  pagoTotal?: number;

  @ApiProperty({ description: 'ID del ticket asociado', example: 'tick-001', required: false })
  @IsString() 
  @IsOptional()
  ticketId?: string;

  @ApiProperty({ description: 'ID del pago relacionado', example: 'pago-001', required: false })
  @IsString() 
  @IsOptional()
  pagoId?: string;
}