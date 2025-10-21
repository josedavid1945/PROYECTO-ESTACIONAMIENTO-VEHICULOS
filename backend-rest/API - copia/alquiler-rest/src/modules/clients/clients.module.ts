import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Vehicle } from './entities/vehiculo.entity';
import { ClienteService } from './services/cliente.service';
import { VehicleService } from './services/vehicle.service';
import { ClienteController } from './controllers/cliente.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente, Vehicle]),
    ConfigModule, // Solo para TipoVehiculoService
  ],
  controllers: [ClienteController, VehicleController],
  providers: [ClienteService, VehicleService],
  exports: [ClienteService, VehicleService],
})
export class ClientsModule {}