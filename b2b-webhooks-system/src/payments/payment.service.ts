import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentAdapter, PaymentRequest, PaymentResult, RefundRequest } from './adapters/payment-adapter.interface';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';

/**
 * PaymentService - Wrapper que abstrae los diferentes adaptadores de pago
 * Implementa circuit breaker y fallback automático
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private adapters: Map<string, IPaymentAdapter> = new Map();
  private activeAdapter: string = 'mock';
  
  // Circuit breaker state
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailure: Date | null = null;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 segundos

  constructor(
    private configService: ConfigService,
    private mockAdapter: MockPaymentAdapter,
    private stripeAdapter: StripePaymentAdapter,
  ) {
    // Registrar adaptadores disponibles
    this.adapters.set('mock', mockAdapter);
    this.adapters.set('stripe', stripeAdapter);
    
    // Determinar adaptador por defecto
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeKey && !stripeKey.startsWith('sk_test_xxx')) {
      this.activeAdapter = 'stripe';
      this.logger.log('Usando Stripe como adaptador de pagos');
    } else {
      this.logger.log('Usando MockAdapter como adaptador de pagos');
    }

    // Configurar callback de webhooks desde mock
    this.mockAdapter.onWebhook((event) => {
      this.logger.debug(`Webhook interno recibido: ${event.event}`);
    });
  }

  /**
   * Procesa un pago con circuit breaker y retry
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Verificar circuit breaker
    if (this.circuitState === 'open') {
      if (this.shouldResetCircuit()) {
        this.circuitState = 'half-open';
        this.logger.log('Circuit breaker en half-open, intentando recuperar');
      } else {
        // Usar fallback
        return this.fallbackPayment(request);
      }
    }

    try {
      const adapter = this.getAdapter();
      const result = await this.executeWithRetry(
        () => adapter.processPayment(request),
        3,
        [1000, 2000, 5000],
      );

      // Éxito - resetear circuit breaker
      if (result.success) {
        this.resetCircuit();
      }

      return result;
    } catch (error) {
      this.handleFailure(error);
      return this.fallbackPayment(request);
    }
  }

  /**
   * Procesa reembolso
   */
  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    const adapter = this.getAdapter();
    return adapter.refundPayment(request);
  }

  /**
   * Obtiene estado de transacción
   */
  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    const adapter = this.getAdapter();
    return adapter.getTransactionStatus(transactionId);
  }

  /**
   * Verifica firma de webhook
   */
  verifyWebhookSignature(payload: string, signature: string, adapter?: string): boolean {
    const targetAdapter = this.adapters.get(adapter || this.activeAdapter);
    return targetAdapter?.verifyWebhookSignature(payload, signature) || false;
  }

  /**
   * Cambia el adaptador activo
   */
  setActiveAdapter(adapterName: string): boolean {
    if (this.adapters.has(adapterName)) {
      this.activeAdapter = adapterName;
      this.logger.log(`Adaptador cambiado a: ${adapterName}`);
      return true;
    }
    return false;
  }

  /**
   * Obtiene información de todos los adaptadores
   */
  async getAdaptersStatus(): Promise<Record<string, { name: string; healthy: boolean; active: boolean }>> {
    const status: Record<string, { name: string; healthy: boolean; active: boolean }> = {};
    
    for (const [name, adapter] of this.adapters) {
      status[name] = {
        name: adapter.name,
        healthy: await adapter.healthCheck(),
        active: name === this.activeAdapter,
      };
    }
    
    return status;
  }

  /**
   * Obtiene estadísticas del mock adapter
   */
  getMockStats() {
    return this.mockAdapter.getStats();
  }

  /**
   * Estado del circuit breaker
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      lastFailure: this.lastFailure,
      activeAdapter: this.activeAdapter,
    };
  }

  // Métodos privados

  private getAdapter(): IPaymentAdapter {
    return this.adapters.get(this.activeAdapter) || this.mockAdapter;
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delays: number[],
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Intento ${attempt + 1}/${maxRetries + 1} falló: ${error}`);
        
        if (attempt < maxRetries) {
          const delay = delays[attempt] || delays[delays.length - 1];
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  private handleFailure(error: any): void {
    this.failureCount++;
    this.lastFailure = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = 'open';
      this.logger.error(`Circuit breaker ABIERTO después de ${this.failureCount} fallos`);
    }
  }

  private shouldResetCircuit(): boolean {
    if (!this.lastFailure) return true;
    return Date.now() - this.lastFailure.getTime() > this.resetTimeout;
  }

  private resetCircuit(): void {
    this.circuitState = 'closed';
    this.failureCount = 0;
    this.lastFailure = null;
  }

  private fallbackPayment(request: PaymentRequest): PaymentResult {
    this.logger.warn('Usando fallback para pago');
    return {
      success: false,
      transactionId: `fallback_${Date.now()}`,
      status: 'pending',
      amount: request.amount,
      currency: request.currency,
      errorMessage: 'Servicio temporalmente no disponible, reintente más tarde',
      metadata: { fallback: true },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
