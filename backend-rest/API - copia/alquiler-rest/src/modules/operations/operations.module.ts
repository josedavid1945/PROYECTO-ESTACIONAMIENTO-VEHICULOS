import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Espacio } from '../parking/entities/espacio.entity';
import { Cliente } from '../clients/entities/cliente.entity';
import { Vehicle } from '../clients/entities/vehiculo.entity';
import { Pago } from '../transactions/entities/pago.entity';
import { DetallePago } from '../transactions/entities/detallePago.entity';
import { TicketService } from './services/ticket.service';
import { RegistroService } from './services/registro.service';
import { TicketController } from './controllers/ticket.controller';
import { RegistroController } from './controllers/registro.controller';
import { ClientsModule } from '../clients/clients.module';
import { ParkingModule } from '../parking/parking.module';
import { ConfigModule } from '../config/config.module';

/**
 * MÓDULO DE OPERACIONES
 * 
 * Este módulo gestiona las operaciones del estacionamiento:
 * - Creación de tickets de ingreso
 * - Registro de salidas
 * - Gestión automática del estado de espacios
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Espacio, Cliente, Vehicle, Pago, DetallePago]),
    ClientsModule,
    ParkingModule,
    ConfigModule,
  ],
  controllers: [TicketController, RegistroController],
  providers: [TicketService, RegistroService],
  exports: [TicketService, RegistroService],
})
export class OperationsModule {}