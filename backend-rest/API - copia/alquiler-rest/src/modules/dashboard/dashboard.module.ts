import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { Espacio } from '../parking/entities/espacio.entity';
import { Ticket } from '../operations/entities/ticket.entity';
import { DetallePago } from '../transactions/entities/detallePago.entity';
import { Seccion } from '../parking/entities/seccion.entity';
import { Vehicle } from '../clients/entities/vehiculo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Espacio,
      Ticket,
      DetallePago,
      Seccion,
      Vehicle,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
