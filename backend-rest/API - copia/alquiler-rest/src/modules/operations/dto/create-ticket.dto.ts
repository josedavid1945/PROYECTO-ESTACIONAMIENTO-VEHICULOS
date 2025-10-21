import { IsDate, IsNotEmpty, IsString } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @ApiProperty({ description: 'Fecha y hora de ingreso', example: '2024-01-15T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaIngreso: Date;

  @ApiProperty({ description: 'ID del vehículo asociado', example: 'veh-001' })
  @IsString() 
  @IsNotEmpty()
  vehiculoId: string; 

  @ApiProperty({ description: 'ID del espacio asignado', example: 'esp-001' })
  @IsString() 
  @IsNotEmpty()
  espacioId: string; 
}