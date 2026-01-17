import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { PaymentController } from './payment.controller';

@Module({
  controllers: [PaymentController],
  providers: [
    MockPaymentAdapter,
    StripePaymentAdapter,
    PaymentService,
  ],
  exports: [PaymentService, MockPaymentAdapter],
})
export class PaymentsModule {}
