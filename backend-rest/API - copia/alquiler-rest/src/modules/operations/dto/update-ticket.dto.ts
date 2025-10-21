import { IsDate, IsOptional, IsString } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTicketDto {
  @ApiProperty({ description: 'Fecha y hora de ingreso', example: '2024-01-15T10:30:00Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaIngreso?: Date;

  @ApiProperty({ description: 'Fecha y hora de salida', example: '2024-01-15T16:30:00Z', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaSalida?: Date;

  @ApiProperty({ description: 'ID del vehículo asociado', example: 'veh-001', required: false })
  @IsString() 
  @IsOptional()
  vehiculoId?: string;

  @ApiProperty({ description: 'ID del espacio asignado', example: 'esp-001', required: false })
  @IsString() 
  @IsOptional()
  espacioId?: string;

  @ApiProperty({ description: 'ID del detalle de pago', example: 'det-pago-001', required: false })
  @IsString() 
  @IsOptional()
  detallePagoId?: string;
}