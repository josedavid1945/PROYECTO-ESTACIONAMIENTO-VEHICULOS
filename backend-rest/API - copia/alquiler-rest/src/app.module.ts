import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParkingModule } from './modules/parking/parking.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FinesModule } from './modules/fines/fines.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { OperationsModule } from './modules/operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // ✅ Connection string CORREGIDO con el username correcto del pooler
      url: 'postgresql://postgres.jqqruzcbtcqcmzkogxqo:l6GKZ7G0RWdWEIOo@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
    ParkingModule,
    ClientsModule, 
    TransactionsModule,
    OperationsModule,
    FinesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}