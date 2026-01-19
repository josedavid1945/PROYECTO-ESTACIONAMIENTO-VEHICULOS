import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Espacio } from '../parking/entities/espacio.entity';
import { Seccion } from '../parking/entities/seccion.entity';
import { Cliente } from '../clients/entities/cliente.entity';
import { Vehicle } from '../clients/entities/vehiculo.entity';
import { Pago } from '../transactions/entities/pago.entity';
import { DetallePago } from '../transactions/entities/detallePago.entity';
import { TipoTarifa } from '../config/entities/tipoTarifa.entity';
import { TipoVehiculo } from '../config/entities/tipoVehiculo.entity';
import { TicketService } from './services/ticket.service';
import { RegistroService } from './services/registro.service';
import { TicketController } from './controllers/ticket.controller';
import { RegistroController } from './controllers/registro.controller';
import { UserPortalService } from './services/user-portal.service';
import { UserPortalController } from './controllers/user-portal.controller';
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
 * - Portal de usuario para consultar reservas
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket, 
      Espacio,
      Seccion, 
      Cliente, 
      Vehicle, 
      Pago, 
      DetallePago, 
      TipoTarifa, 
      TipoVehiculo
    ]),
    ClientsModule,
    ParkingModule,
    ConfigModule,
  ],
  controllers: [TicketController, RegistroController, UserPortalController],
  providers: [TicketService, RegistroService, UserPortalService],
  exports: [TicketService, RegistroService, UserPortalService],
})
export class OperationsModule {}