import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentRequest, RefundRequest } from './adapters/payment-adapter.interface';

class ProcessPaymentDto implements PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

class RefundPaymentDto implements RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  @ApiOperation({ summary: 'Procesar un pago' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 201, description: 'Pago procesado' })
  async processPayment(@Body() request: ProcessPaymentDto) {
    return this.paymentService.processPayment(request);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Procesar un reembolso' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({ status: 201, description: 'Reembolso procesado' })
  async refundPayment(@Body() request: RefundPaymentDto) {
    return this.paymentService.refundPayment(request);
  }

  @Get('transaction/:id')
  @ApiOperation({ summary: 'Obtener estado de transacción' })
  @ApiResponse({ status: 200, description: 'Estado de la transacción' })
  async getTransactionStatus(@Param('id') transactionId: string) {
    return this.paymentService.getTransactionStatus(transactionId);
  }

  @Get('adapters/status')
  @ApiOperation({ summary: 'Estado de los adaptadores de pago' })
  @ApiResponse({ status: 200, description: 'Estado de adaptadores' })
  async getAdaptersStatus() {
    return this.paymentService.getAdaptersStatus();
  }

  @Post('adapters/switch')
  @ApiOperation({ summary: 'Cambiar adaptador activo' })
  @ApiResponse({ status: 200, description: 'Adaptador cambiado' })
  async switchAdapter(@Query('adapter') adapter: string) {
    const success = this.paymentService.setActiveAdapter(adapter);
    return { success, activeAdapter: adapter };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas del mock adapter' })
  @ApiResponse({ status: 200, description: 'Estadísticas de transacciones' })
  getStats() {
    return {
      mockStats: this.paymentService.getMockStats(),
      circuitBreaker: this.paymentService.getCircuitBreakerStatus(),
    };
  }
}
