import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ParkingApiService } from './services/parking-api.service';
import { SignatureService } from './services/signature.service';
import { CacheService } from './services/cache.service';
import { HealthController } from './controllers/health.controller';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: 30000,
        maxRedirects: 5,
        baseURL: configService.get('PARKING_API_URL', 'http://localhost:3000'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController],
  providers: [ParkingApiService, SignatureService, CacheService],
  exports: [HttpModule, ParkingApiService, SignatureService, CacheService],
})
export class SharedModule {}
