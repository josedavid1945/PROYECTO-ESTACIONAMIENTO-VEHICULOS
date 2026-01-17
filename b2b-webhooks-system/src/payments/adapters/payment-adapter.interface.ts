// Interfaz base para todos los adaptadores de pago
export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  rawResponse?: any;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // Parcial si se especifica
  reason?: string;
}

export interface IPaymentAdapter {
  name: string;
  
  // Operaciones principales
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  refundPayment(request: RefundRequest): Promise<PaymentResult>;
  getTransactionStatus(transactionId: string): Promise<PaymentResult>;
  
  // Verificación de webhooks
  verifyWebhookSignature(payload: string, signature: string): boolean;
  
  // Health check
  healthCheck(): Promise<boolean>;
}
