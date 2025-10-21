import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoTarifa } from './entities/tipoTarifa.entity';
import { TipoVehiculo } from './entities/tipoVehiculo.entity';
import { TipoMulta } from './entities/tipoMulta.entity';
import { TipoTarifaService } from './services/tipo-tarifa.service';
import { TipoVehiculoService } from './services/tipo-vehiculo.service';
import { TipoMultaService } from './services/tipo-multa.service';
import { TipoTarifaController } from './controllers/tipo-tarifa.controller';
import { TipoVehiculoController } from './controllers/tipo-vehiculo.controller';
import { TipoMultaController } from './controllers/tipo-multa.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TipoTarifa, TipoVehiculo, TipoMulta]),
  ],
  controllers: [TipoTarifaController, TipoVehiculoController, TipoMultaController],
  providers: [TipoTarifaService, TipoVehiculoService, TipoMultaService],
  exports: [TipoTarifaService, TipoVehiculoService, TipoMultaService],
})
export class ConfigModule {}