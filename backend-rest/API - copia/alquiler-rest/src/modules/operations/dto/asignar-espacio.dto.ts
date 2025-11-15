import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarEspacioDto {
  @ApiProperty({ description: 'ID del vehículo existente', example: 'uuid-vehiculo' })
  @IsUUID()
  @IsNotEmpty()
  vehiculoId: string;

  @ApiProperty({ description: 'ID del espacio a asignar', example: 'uuid-espacio' })
  @IsUUID()
  @IsNotEmpty()
  espacioId: string;
}
