import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PartnersModule } from '../partners/partners.module';
import { EventsModule } from '../events/events.module';
import { N8nModule } from '../n8n/n8n.module';

@Module({
  imports: [PartnersModule, EventsModule, N8nModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
