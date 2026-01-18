import { IsUUID, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DesocuparEspacioDto {
  @ApiProperty({ description: 'ID del ticket activo', example: 'uuid-ticket' })
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @ApiProperty({ description: 'Método de pago', example: 'Efectivo' })
  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @ApiPropertyOptional({ 
    description: 'Monto del pago (opcional - se calcula automáticamente si no se proporciona)', 
    example: 15.50 
  })
  @IsNumber()
  @IsOptional()
  montoPago?: number;

  @ApiPropertyOptional({ 
    description: 'ID del tipo de tarifa (opcional - se obtiene del vehículo si no se proporciona)', 
    example: 'uuid-tipo-tarifa' 
  })
  @IsUUID()
  @IsOptional()
  tipoTarifaId?: string;
}
