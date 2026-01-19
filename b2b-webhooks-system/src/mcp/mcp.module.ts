import { Module, forwardRef } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpToolsService } from './mcp-tools.service';
import { BusinessToolsService } from './business-tools.service';
import { ParkingToolsService } from './parking-tools.service';
import { PartnersModule } from '../partners/partners.module';
import { EventsModule } from '../events/events.module';
import { PaymentsModule } from '../payments/payments.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    forwardRef(() => AiModule),
    forwardRef(() => PartnersModule),
    forwardRef(() => EventsModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [McpController],
  providers: [McpToolsService, BusinessToolsService, ParkingToolsService],
  exports: [McpToolsService, BusinessToolsService, ParkingToolsService],
})
export class McpModule {}
