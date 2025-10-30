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
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      
      // ========================================
      // ☁️ SUPABASE - EN USO
      // ========================================
      url: 'postgresql://postgres.jqqruzcbtcqcmzkogxqo:l6GKZ7G0RWdWEIOo@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
      
      // ========================================
      // 🐳 DOCKER LOCAL - Comentado (problema de autenticación)
      // ========================================
      // url: 'postgresql://admin:admin123@localhost:5432/estacionamiento',
      // host: 'localhost',
      // port: 5432,
      // username: 'admin',
      // password: 'admin123',
      // database: 'estacionamiento',
      
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
    ParkingModule,
    ClientsModule, 
    TransactionsModule,
    OperationsModule,
    FinesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}