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
import { N8nModule } from './n8n/n8n.module';

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
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const useSSL = configService.get('DB_SSL', 'false') === 'true';
        // Parse URL manually to handle usernames with dots (like postgres.xxx)
        const url = new URL(databaseUrl);
        const config = {
          type: 'postgres' as const,
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          username: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          database: url.pathname.replace('/', ''),
          autoLoadEntities: true,
          // Solo sincronizar en desarrollo - NUNCA en producción
          synchronize: nodeEnv === 'development',
          ssl: useSSL ? { rejectUnauthorized: false } : false,
        };
        console.log('🔧 Database config:', {
          host: config.host,
          port: config.port,
          username: config.username,
          database: config.database,
        });
        return config;
      },
    }),

    // Tareas programadas
    ScheduleModule.forRoot(),

    // Módulos de la aplicación
    SharedModule,
    N8nModule,
    PartnersModule,
    WebhooksModule,
    PaymentsModule,
    EventsModule,
    McpModule,
    AiModule,
  ],
})
export class AppModule {}
