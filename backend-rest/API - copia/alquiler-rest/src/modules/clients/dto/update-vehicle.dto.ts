import { IsString, IsOptional } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleDto {
  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-123', required: false })
  @IsString()
  @IsOptional()
  placa?: string;

  @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota', required: false })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla', required: false })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiProperty({ description: 'ID del cliente propietario', example: 'cli-001', required: false })
  @IsString() // ✅ Cambiar a IsString
  @IsOptional()
  clienteId?: string;

  @ApiProperty({ description: 'ID del tipo de vehículo', example: 'tipo-veh-001', required: false })
  @IsString() // ✅ Cambiar a IsString
  @IsOptional()
  tipoVehiculoId?: string;
}