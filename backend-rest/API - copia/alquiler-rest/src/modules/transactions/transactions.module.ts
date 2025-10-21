import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { DetallePago } from './entities/detallePago.entity';
import { PagoService } from './services/pago.service';
import { DetallePagoService } from './services/detalle-pago.service';
import { PagoController } from './controllers/pago.controller';
import { DetallePagoController } from './controllers/detalle-pago.controller';
import { ConfigModule } from '../config/config.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, DetallePago]),
    ConfigModule,        // Para TipoTarifaService
    OperationsModule,    // Para TicketService (solo lectura)
  ],
  controllers: [PagoController, DetallePagoController],
  providers: [PagoService, DetallePagoService],
  exports: [PagoService, DetallePagoService],
})
export class TransactionsModule {}