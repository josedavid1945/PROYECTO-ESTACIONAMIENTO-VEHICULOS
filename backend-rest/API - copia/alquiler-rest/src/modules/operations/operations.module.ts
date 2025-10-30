import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Espacio } from '../parking/entities/espacio.entity';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';
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
    // MODIFICACIÓN: Se agregó Espacio para poder gestionar el estado de los espacios
    // Ticket: Registros de ingreso/salida de vehículos
    // Espacio: Para marcar como ocupado/disponible automáticamente
    TypeOrmModule.forFeature([Ticket, Espacio]),
    ClientsModule,    // Para VehicleService
    ParkingModule,    // Para EspacioService  
    ConfigModule,     // Para TipoTarifaService (solo lectura)
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class OperationsModule {}