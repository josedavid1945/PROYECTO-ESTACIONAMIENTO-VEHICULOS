import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';
import { ClientsModule } from '../clients/clients.module';
import { ParkingModule } from '../parking/parking.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    ClientsModule,    // Para VehicleService
    ParkingModule,    // Para EspacioService  
    ConfigModule,     // Para TipoTarifaService (solo lectura)
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class OperationsModule {}