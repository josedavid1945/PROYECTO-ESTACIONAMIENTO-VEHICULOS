import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seccion } from './entities/seccion.entity';
import { Espacio } from './entities/espacio.entity';
import { SeccionService } from './services/seccion.service';
import { EspacioService } from './services/espacio.service';
import { SeccionController } from './controllers/seccion.controller';
import { EspacioController } from './controllers/espacio.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seccion, Espacio]),
  ],
  controllers: [SeccionController, EspacioController],
  providers: [SeccionService, EspacioService],
  exports: [SeccionService, EspacioService],
})
export class ParkingModule {}