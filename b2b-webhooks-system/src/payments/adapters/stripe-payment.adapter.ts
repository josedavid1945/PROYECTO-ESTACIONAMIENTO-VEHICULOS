import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentAdapter,
  PaymentRequest,
  PaymentResult,
  RefundRequest,
} from './payment-adapter.interface';

/**
 * StripeAdapter - Adaptador real para Stripe
 * Solo se activa si STRIPE_SECRET_KEY está configurado
 */
@Injectable()
export class StripePaymentAdapter implements IPaymentAdapter {
  name = 'stripe';
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private stripe: Stripe | null = null;
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    
    if (secretKey && !secretKey.startsWith('sk_test_xxx')) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
      this.logger.log('Stripe adapter inicializado correctamente');
    } else {
      this.logger.warn('Stripe no configurado - usando modo simulado');
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.stripe) {
      return this.mockPayment(request);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Stripe usa centavos
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: request.metadata as Stripe.MetadataParam,
        ...(request.idempotencyKey && {
          idempotencyKey: request.idempotencyKey,
        }),
      });

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: request.amount,
        currency: request.currency,
        metadata: paymentIntent.metadata,
        rawResponse: paymentIntent,
      };
    } catch (error: any) {
      this.logger.error(`Error Stripe: ${error.message}`);
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        errorMessage: error.message,
      };
    }
  }

  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    if (!this.stripe) {
      return this.mockRefund(request);
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: request.transactionId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as Stripe.RefundCreateParams.Reason,
      });

      return {
        success: refund.status === 'succeeded',
        transactionId: refund.id,
        status: 'refunded',
        amount: (refund.amount || 0) / 100,
        currency: refund.currency,
        metadata: { reason: request.reason },
      };
    } catch (error: any) {
      this.logger.error(`Error Stripe refund: ${error.message}`);
      return {
        success: false,
        transactionId: request.transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorMessage: error.message,
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    if (!this.stripe) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorMessage: 'Stripe no configurado',
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: (paymentIntent.amount || 0) / 100,
        currency: paymentIntent.currency.toUpperCase(),
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorMessage: error.message,
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.stripe || !this.webhookSecret) {
      return false;
    }

    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.stripe) {
      return false;
    }

    try {
      await this.stripe.balance.retrieve();
      return true;
    } catch {
      return false;
    }
  }

  private mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      succeeded: 'success',
      processing: 'pending',
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'pending',
      canceled: 'failed',
    };
    return statusMap[status] || 'pending';
  }

  // Métodos mock para cuando Stripe no está configurado
  private mockPayment(request: PaymentRequest): PaymentResult {
    return {
      success: true,
      transactionId: `stripe_mock_${Date.now()}`,
      status: 'success',
      amount: request.amount,
      currency: request.currency,
      metadata: { mock: true, ...request.metadata },
    };
  }

  private mockRefund(request: RefundRequest): PaymentResult {
    return {
      success: true,
      transactionId: `stripe_refund_mock_${Date.now()}`,
      status: 'refunded',
      amount: request.amount || 0,
      currency: 'USD',
      metadata: { mock: true, originalId: request.transactionId },
    };
  }
}
