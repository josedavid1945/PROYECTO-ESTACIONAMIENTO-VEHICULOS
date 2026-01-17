import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PartnersModule } from '../partners/partners.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PartnersModule, EventsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
