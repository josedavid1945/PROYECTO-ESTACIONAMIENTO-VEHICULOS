import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { N8nIntegrationService } from './n8n-integration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [N8nIntegrationService],
  exports: [N8nIntegrationService],
})
export class N8nModule {}
