import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Multa } from './entities/multa.entity';
import { MultaService } from './services/multa.service';
import { MultaController } from './controllers/multa.controller';
import { ConfigModule } from '../config/config.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Multa]),
    ConfigModule,           // Para TipoMultaService
    TransactionsModule,     // Para DetallePagoService
  ],
  controllers: [MultaController],
  providers: [MultaService],
  exports: [MultaService],
})
export class FinesModule {}