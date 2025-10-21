import { IsString, IsNotEmpty } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  marca: string;

  @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  modelo: string;

  @ApiProperty({ description: 'ID del cliente propietario', example: 'cli-001' })
  @IsString() 
  @IsNotEmpty()
  clienteId: string; 

  @ApiProperty({ description: 'ID del tipo de vehículo', example: 'tipo-veh-001' })
  @IsString() 
  @IsNotEmpty()
  tipoVehiculoId: string; 
}