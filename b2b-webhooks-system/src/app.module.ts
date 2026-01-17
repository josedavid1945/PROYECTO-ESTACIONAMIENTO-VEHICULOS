import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PartnersModule } from './partners/partners.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PaymentsModule } from './payments/payments.module';
import { EventsModule } from './events/events.module';
import { McpModule } from './mcp/mcp.module';
import { AiModule } from './ai/ai.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Solo desarrollo
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),

    // Tareas programadas
    ScheduleModule.forRoot(),

    // Módulos de la aplicación
    SharedModule,
    PartnersModule,
    WebhooksModule,
    PaymentsModule,
    EventsModule,
    McpModule,
    AiModule,
  ],
})
export class AppModule {}
