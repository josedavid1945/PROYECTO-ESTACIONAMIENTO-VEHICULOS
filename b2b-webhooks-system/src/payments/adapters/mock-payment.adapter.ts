import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentAdapter,
  PaymentRequest,
  PaymentResult,
  RefundRequest,
} from './payment-adapter.interface';

/**
 * MockAdapter - Simulador avanzado de pagos
 * Genera webhooks realistas para pruebas B2B
 */
@Injectable()
export class MockPaymentAdapter implements IPaymentAdapter {
  name = 'mock';
  private readonly logger = new Logger(MockPaymentAdapter.name);
  
  // Almacén de transacciones simuladas
  private transactions = new Map<string, PaymentResult>();
  
  // Callbacks para notificar webhooks
  private webhookCallbacks: ((event: any) => void)[] = [];

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const transactionId = `mock_txn_${uuidv4().substring(0, 8)}`;
    
    // Simular diferentes escenarios basados en el monto
    let status: PaymentResult['status'] = 'success';
    let errorMessage: string | undefined;
    
    // Montos especiales para simular errores
    if (request.amount === 666) {
      status = 'failed';
      errorMessage = 'Tarjeta rechazada (simulación)';
    } else if (request.amount === 999) {
      status = 'pending';
    }
    
    const result: PaymentResult = {
      success: status === 'success',
      transactionId,
      status,
      amount: request.amount,
      currency: request.currency || 'USD',
      metadata: {
        ...request.metadata,
        processedAt: new Date().toISOString(),
        adapter: 'mock',
        idempotencyKey: request.idempotencyKey,
      },
      errorMessage,
    };
    
    // Guardar transacción
    this.transactions.set(transactionId, result);
    
    // Emitir webhook después de un delay (simula procesamiento async)
    this.emitWebhookDelayed({
      event: `payment.${status}`,
      data: {
        transactionId,
        amount: request.amount,
        currency: request.currency,
        status,
        timestamp: new Date().toISOString(),
      },
    }, 500);
    
    this.logger.log(`Pago procesado: ${transactionId} - ${status} - $${request.amount}`);
    
    return result;
  }

  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    const original = this.transactions.get(request.transactionId);
    
    if (!original) {
      return {
        success: false,
        transactionId: request.transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorMessage: 'Transacción no encontrada',
      };
    }
    
    const refundAmount = request.amount || original.amount;
    const refundId = `mock_ref_${uuidv4().substring(0, 8)}`;
    
    const result: PaymentResult = {
      success: true,
      transactionId: refundId,
      status: 'refunded',
      amount: refundAmount,
      currency: original.currency,
      metadata: {
        originalTransactionId: request.transactionId,
        reason: request.reason,
        refundedAt: new Date().toISOString(),
      },
    };
    
    // Actualizar transacción original
    original.status = 'refunded';
    this.transactions.set(request.transactionId, original);
    this.transactions.set(refundId, result);
    
    // Emitir webhook de reembolso
    this.emitWebhookDelayed({
      event: 'payment.refunded',
      data: {
        transactionId: refundId,
        originalTransactionId: request.transactionId,
        amount: refundAmount,
        reason: request.reason,
        timestamp: new Date().toISOString(),
      },
    }, 300);
    
    this.logger.log(`Reembolso procesado: ${refundId} - $${refundAmount}`);
    
    return result;
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        amount: 0,
        currency: 'USD',
        errorMessage: 'Transacción no encontrada',
      };
    }
    
    return transaction;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // En el mock, siempre válido para pruebas
    // En producción, usar HMAC-SHA256
    return signature.startsWith('mock_sig_') || signature === 'test';
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // Métodos adicionales para simulación
  
  /**
   * Registra un callback para recibir webhooks simulados
   */
  onWebhook(callback: (event: any) => void): void {
    this.webhookCallbacks.push(callback);
  }

  /**
   * Simula un ciclo completo de transacción
   */
  async simulateFullCycle(amount: number): Promise<void> {
    // 1. Pago inicial
    const payment = await this.processPayment({
      amount,
      currency: 'USD',
      description: 'Simulación de ciclo completo',
    });
    
    // 2. Si exitoso, simular posible disputa después de un delay
    if (payment.success && Math.random() > 0.8) {
      setTimeout(() => {
        this.emitWebhookDelayed({
          event: 'payment.disputed',
          data: {
            transactionId: payment.transactionId,
            reason: 'customer_dispute',
            timestamp: new Date().toISOString(),
          },
        }, 0);
      }, 2000);
    }
  }

  /**
   * Genera estadísticas de transacciones
   */
  getStats(): { total: number; successful: number; failed: number; refunded: number } {
    const stats = { total: 0, successful: 0, failed: 0, refunded: 0 };
    
    this.transactions.forEach((txn) => {
      stats.total++;
      if (txn.status === 'success') stats.successful++;
      else if (txn.status === 'failed') stats.failed++;
      else if (txn.status === 'refunded') stats.refunded++;
    });
    
    return stats;
  }

  private emitWebhookDelayed(event: any, delayMs: number): void {
    setTimeout(() => {
      this.webhookCallbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (error) {
          this.logger.error(`Error en webhook callback: ${error}`);
        }
      });
    }, delayMs);
  }
}
