import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpToolsService, McpTool } from './mcp-tools.service';
import { PartnersService } from '../partners/partners.service';
import { EventsService } from '../events/events.service';
import { PaymentService } from '../payments/payment.service';
import { EventType } from '../events/entities/event.entity';
import { PartnerType } from '../partners/entities/partner.entity';
import * as pdf from 'pdf-parse';

/**
 * BusinessToolsService - Implementa las 5+ herramientas de negocio MCP
 */
@Injectable()
export class BusinessToolsService implements OnModuleInit {
  private readonly logger = new Logger(BusinessToolsService.name);
  private readonly parkingApiUrl: string;

  constructor(
    private mcpTools: McpToolsService,
    private configService: ConfigService,
    private partnersService: PartnersService,
    private eventsService: EventsService,
    private paymentService: PaymentService,
  ) {
    this.parkingApiUrl = this.configService.get('PARKING_API_URL', 'http://localhost:3000');
  }

  onModuleInit() {
    this.registerAllTools();
    this.logger.log('Herramientas de negocio MCP registradas');
  }

  private registerAllTools(): void {
    // ============ HERRAMIENTAS DE CONSULTA (ADMIN) ============
    // NOTA: buscar_espacios está registrado en parking-tools.service.ts

    // 2. Ver ticket/reserva (ADMIN)
    this.mcpTools.registerTool({
      name: 'ver_ticket',
      description: 'Obtiene información detallada de un ticket de estacionamiento por su ID o placa del vehículo.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          ticketId: {
            type: 'string',
            description: 'ID del ticket',
          },
          placa: {
            type: 'string',
            description: 'Placa del vehículo',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          // Buscar por ID si se proporciona
          if (params.ticketId) {
            const response = await fetch(`${this.parkingApiUrl}/tickets/${params.ticketId}`);
            if (response.ok) {
              return await response.json();
            }
          }

          // Buscar por placa
          if (params.placa) {
            const response = await fetch(`${this.parkingApiUrl}/tickets`);
            const tickets = await response.json();
            const ticket = tickets.find((t: any) => 
              t.vehiculo?.placa?.toLowerCase() === params.placa.toLowerCase()
            );
            
            if (ticket) {
              return ticket;
            }
          }

          return { error: 'Ticket no encontrado. Proporcione un ID válido o placa de vehículo.' };
        } catch (error: any) {
          return { error: `Error al buscar ticket: ${error.message}` };
        }
      },
    });

    // ============ HERRAMIENTAS DE ACCIÓN (ADMIN) ============

    // 3. Crear reserva (ADMIN)
    this.mcpTools.registerTool({
      name: 'crear_reserva',
      description: 'Crea una nueva reserva de espacio de estacionamiento.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          espacioId: {
            type: 'string',
            description: 'ID del espacio a reservar',
          },
          clienteId: {
            type: 'string',
            description: 'ID del cliente',
          },
          vehiculoPlaca: {
            type: 'string',
            description: 'Placa del vehículo',
          },
          duracionMinutos: {
            type: 'number',
            description: 'Duración estimada de la reserva en minutos',
          },
        },
        required: ['espacioId', 'vehiculoPlaca'],
      },
      handler: async (params) => {
        try {
          // Verificar disponibilidad
          const espacioResponse = await fetch(`${this.parkingApiUrl}/espacios/${params.espacioId}`);
          if (!espacioResponse.ok) {
            return { error: 'Espacio no encontrado' };
          }
          
          const espacio = await espacioResponse.json();
          if (!espacio.estado) {
            return { error: 'El espacio no está disponible' };
          }

          // Crear ticket
          const ticketResponse = await fetch(`${this.parkingApiUrl}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              espacioId: params.espacioId,
              vehiculoPlaca: params.vehiculoPlaca,
              fechaEntrada: new Date().toISOString(),
            }),
          });

          if (!ticketResponse.ok) {
            const errorText = await ticketResponse.text();
            return { error: `No se pudo crear la reserva: ${errorText}` };
          }

          const ticket = await ticketResponse.json();

          return {
            success: true,
            mensaje: `Reserva creada exitosamente`,
            ticket: {
              id: ticket.id,
              espacio: params.espacioId,
              vehiculo: params.vehiculoPlaca,
              fechaEntrada: ticket.fechaEntrada,
            },
          };
        } catch (error: any) {
          return { error: `Error al crear reserva: ${error.message}` };
        }
      },
    });

    // 4. Procesar pago (ADMIN)
    this.mcpTools.registerTool({
      name: 'procesar_pago',
      description: 'Procesa el pago de un ticket de estacionamiento.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          ticketId: {
            type: 'string',
            description: 'ID del ticket a pagar',
          },
          monto: {
            type: 'number',
            description: 'Monto a pagar',
          },
          metodoPago: {
            type: 'string',
            description: 'Método de pago',
            enum: ['efectivo', 'tarjeta', 'transferencia'],
          },
        },
        required: ['ticketId', 'monto'],
      },
      handler: async (params) => {
        const idempotencyKey = `pago_${params.ticketId}_${Date.now()}`;
        
        // Procesar con el servicio de pagos
        const result = await this.paymentService.processPayment({
          amount: params.monto,
          currency: 'USD',
          description: `Pago de ticket ${params.ticketId}`,
          metadata: {
            ticketId: params.ticketId,
            metodoPago: params.metodoPago || 'efectivo',
          },
          idempotencyKey,
        });

        if (result.success) {
          // Registrar pago en el sistema
          try {
            await fetch(`${this.parkingApiUrl}/detalle-pago`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ticketId: params.ticketId,
                pagoTotal: params.monto,
                metodo: params.metodoPago || 'efectivo',
                fechaPago: new Date().toISOString(),
              }),
            });
          } catch (e) {
            this.logger.warn('No se pudo registrar el pago en el sistema principal');
          }
        }

        return {
          success: result.success,
          transactionId: result.transactionId,
          monto: result.amount,
          estado: result.status,
          mensaje: result.success 
            ? `Pago de $${result.amount} procesado correctamente`
            : `Error en el pago: ${result.errorMessage}`,
        };
      },
    });

    // ============ HERRAMIENTAS DE REPORTE (ADMIN) ============

    // 5. Resumen de ventas/recaudación
    this.mcpTools.registerTool({
      name: 'resumen_recaudacion',
      description: 'Obtiene un resumen de la recaudación del estacionamiento.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período del reporte',
            enum: ['hoy', 'semana', 'mes'],
          },
        },
        required: [],
      },
      timeout: 15000,
      handler: async (params) => {
        const cacheKey = `recaudacion_${params.periodo || 'hoy'}`;
        const cached = this.mcpTools.getCached<any>(cacheKey);
        if (cached) {
          return { ...cached, fromCache: true };
        }

        try {
          // Obtener pagos
          const response = await fetch(`${this.parkingApiUrl}/detalle-pago`);
          const pagos = await response.json();

          const ahora = new Date();
          let fechaInicio: Date;

          switch (params.periodo) {
            case 'semana':
              fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'mes':
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
              break;
            default: // hoy
              fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
          }

          const pagosFiltrados = pagos.filter((p: any) => 
            new Date(p.fechaPago) >= fechaInicio
          );

          const total = pagosFiltrados.reduce((sum: number, p: any) => sum + (p.pagoTotal || 0), 0);
          const porMetodo = pagosFiltrados.reduce((acc: any, p: any) => {
            const metodo = p.metodo || 'otro';
            acc[metodo] = (acc[metodo] || 0) + (p.pagoTotal || 0);
            return acc;
          }, {});

          const result = {
            periodo: params.periodo || 'hoy',
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: ahora.toISOString(),
            totalRecaudado: total,
            cantidadTransacciones: pagosFiltrados.length,
            promedioTransaccion: pagosFiltrados.length > 0 ? total / pagosFiltrados.length : 0,
            recaudacionPorMetodo: porMetodo,
          };

          // Cachear por 5 minutos
          this.mcpTools.setCache(cacheKey, result, 5 * 60 * 1000);

          return result;
        } catch (error: any) {
          return { error: `Error al obtener recaudación: ${error.message}` };
        }
      },
    });

    // ============ HERRAMIENTAS B2B (SOLO ADMIN) ============

    // 6. Registrar partner
    this.mcpTools.registerTool({
      name: 'registrar_partner',
      description: 'Registra un nuevo partner B2B en el sistema.',
      allowedRoles: ['admin'],
      parameters: {
        type: 'object',
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre del partner',
          },
          tipo: {
            type: 'string',
            description: 'Tipo de partner',
            enum: ['hotel', 'tour_operator', 'restaurant', 'parking_app', 'reservation_system', 'other'],
          },
          webhookUrl: {
            type: 'string',
            description: 'URL para recibir webhooks',
          },
          email: {
            type: 'string',
            description: 'Email de contacto',
          },
        },
        required: ['nombre', 'tipo'],
      },
      handler: async (params) => {
        try {
          const result = await this.partnersService.register({
            name: params.nombre,
            type: params.tipo as PartnerType,
            webhookUrl: params.webhookUrl,
            email: params.email,
          });

          return {
            success: true,
            mensaje: `Partner "${params.nombre}" registrado exitosamente`,
            credenciales: {
              id: result.id,
              apiKey: result.apiKey,
              nota: 'Las credenciales completas se muestran solo una vez',
            },
          };
        } catch (error: any) {
          return { error: `Error al registrar partner: ${error.message}` };
        }
      },
    });

    // 7. Listar partners (ADMIN)
    this.mcpTools.registerTool({
      name: 'listar_partners',
      description: 'Lista todos los partners B2B registrados.',
      allowedRoles: ['admin'],
      parameters: {
        type: 'object',
        properties: {
          estado: {
            type: 'string',
            description: 'Filtrar por estado',
            enum: ['active', 'inactive', 'suspended', 'pending'],
          },
        },
        required: [],
      },
      handler: async (params) => {
        const partners = await this.partnersService.findAll();
        let filtered = partners;

        if (params.estado) {
          filtered = partners.filter((p: any) => p.status === params.estado);
        }

        return {
          total: filtered.length,
          partners: filtered.map((p: any) => ({
            id: p.id,
            nombre: p.name,
            tipo: p.type,
            estado: p.status,
            webhookUrl: p.webhookUrl,
            ultimaActividad: p.lastActivity,
            webhooksExitosos: p.successfulWebhooks,
            webhooksFallidos: p.failedWebhooks,
          })),
        };
      },
    });

    // 8. Simular evento para partner (ADMIN)
    this.mcpTools.registerTool({
      name: 'simular_evento_partner',
      description: 'Simula un evento de estacionamiento y lo envía a un partner específico.',
      allowedRoles: ['admin'],
      parameters: {
        type: 'object',
        properties: {
          partnerId: {
            type: 'string',
            description: 'ID del partner',
          },
          tipoEvento: {
            type: 'string',
            description: 'Tipo de evento a simular',
            enum: ['parking.reserved', 'parking.entered', 'parking.exited', 'payment.success'],
          },
          datos: {
            type: 'object',
            description: 'Datos adicionales del evento',
          },
        },
        required: ['partnerId', 'tipoEvento'],
      },
      handler: async (params) => {
        const event = await this.eventsService.emit({
          partnerId: params.partnerId,
          eventType: params.tipoEvento as EventType,
          payload: params.datos || {
            simulado: true,
            timestamp: new Date().toISOString(),
          },
        });

        return {
          success: true,
          mensaje: `Evento ${params.tipoEvento} creado y en cola de entrega`,
          evento: {
            id: event.id,
            tipo: event.eventType,
            estado: event.status,
          },
        };
      },
    });

    // 9. Estadísticas de eventos (ADMIN)
    this.mcpTools.registerTool({
      name: 'estadisticas_eventos',
      description: 'Obtiene estadísticas de los eventos/webhooks del sistema.',
      allowedRoles: ['admin'],
      parameters: {
        type: 'object',
        properties: {
          partnerId: {
            type: 'string',
            description: 'Filtrar por partner específico',
          },
        },
        required: [],
      },
      handler: async (params) => {
        const stats = await this.eventsService.getStats(params.partnerId);
        
        return {
          ...stats,
          tasaExito: stats.total > 0 
            ? ((stats.delivered / stats.total) * 100).toFixed(2) + '%'
            : 'N/A',
          tiempoPromedioEntrega: stats.avgDeliveryTime + 'ms',
        };
      },
    });

    // 10. Diagnosticar webhook fallido (ADMIN)
    this.mcpTools.registerTool({
      name: 'diagnosticar_webhook',
      description: 'Analiza por qué falló un webhook y sugiere soluciones.',
      allowedRoles: ['admin'],
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID del evento a diagnosticar',
          },
          partnerId: {
            type: 'string',
            description: 'ID del partner para ver últimos fallos',
          },
        },
        required: [],
      },
      handler: async (params) => {
        const dlq = await this.eventsService.getDeadLetterQueue(params.partnerId);
        
        if (dlq.length === 0) {
          return { mensaje: 'No hay webhooks fallidos en la cola' };
        }

        const evento = params.eventId 
          ? dlq.find(e => e.id === params.eventId)
          : dlq[0];

        if (!evento) {
          return { error: 'Evento no encontrado' };
        }

        // Analizar errores
        const diagnostico = {
          eventoId: evento.id,
          partnerId: evento.partnerId,
          tipoEvento: evento.eventType,
          intentos: evento.retryCount,
          ultimoError: evento.errorMessage,
          historialErrores: evento.errorHistory,
          posiblesCausas: [] as string[],
          sugerencias: [] as string[],
        };

        // Analizar el mensaje de error
        const error = evento.errorMessage?.toLowerCase() || '';
        
        if (error.includes('timeout')) {
          diagnostico.posiblesCausas.push('El servidor del partner tarda demasiado en responder');
          diagnostico.sugerencias.push('Verificar que el endpoint del partner esté optimizado');
          diagnostico.sugerencias.push('Considerar aumentar el timeout si es necesario');
        }
        
        if (error.includes('connection') || error.includes('econnrefused')) {
          diagnostico.posiblesCausas.push('No se puede conectar al servidor del partner');
          diagnostico.sugerencias.push('Verificar que la URL del webhook sea correcta');
          diagnostico.sugerencias.push('Verificar que el servidor del partner esté funcionando');
        }
        
        if (error.includes('401') || error.includes('403')) {
          diagnostico.posiblesCausas.push('Error de autenticación');
          diagnostico.sugerencias.push('Verificar las credenciales del partner');
          diagnostico.sugerencias.push('Rotar las credenciales si es necesario');
        }
        
        if (error.includes('500') || error.includes('502') || error.includes('503')) {
          diagnostico.posiblesCausas.push('Error interno en el servidor del partner');
          diagnostico.sugerencias.push('Contactar al partner para revisar sus logs');
          diagnostico.sugerencias.push('Reintentar el evento más tarde');
        }

        if (diagnostico.posiblesCausas.length === 0) {
          diagnostico.posiblesCausas.push('Error desconocido');
          diagnostico.sugerencias.push('Revisar los logs del sistema para más detalles');
        }

        return diagnostico;
      },
    });

    // ============ HERRAMIENTA DE VERIFICACIÓN PDF ============

    // Verificar ticket desde PDF
    this.mcpTools.registerTool({
      name: 'verificar_ticket_pdf',
      description: 'Lee y verifica la existencia de un ticket de estacionamiento desde un archivo PDF. Extrae datos como ID del ticket, placa, fechas y montos para validar contra la base de datos.',
      allowedRoles: ['admin', 'operator', 'user'],
      parameters: {
        type: 'object',
        properties: {
          pdf_base64: {
            type: 'string',
            description: 'Contenido del archivo PDF codificado en base64',
          },
          validar_en_bd: {
            type: 'boolean',
            description: 'Si es true, valida el ticket extraído contra la base de datos (default: true)',
          },
        },
        required: ['pdf_base64'],
      },
      handler: async (params) => {
        try {
          // 1. Decodificar PDF de base64
          const pdfBuffer = Buffer.from(params.pdf_base64, 'base64');
          
          // 2. Extraer texto del PDF
          const pdfData = await pdf(pdfBuffer);
          const texto = pdfData.text;

          this.logger.log(`PDF procesado: ${pdfData.numpages} páginas, ${texto.length} caracteres`);

          // 3. Extraer datos del ticket usando patrones
          const datosExtraidos = this.extraerDatosTicketPDF(texto);

          // 4. Validar contra la base de datos si se requiere
          let validacion = null;
          if (params.validar_en_bd !== false && datosExtraidos.ticketId) {
            validacion = await this.validarTicketEnBD(datosExtraidos);
          }

          return {
            success: true,
            pdf_info: {
              paginas: pdfData.numpages,
              caracteres: texto.length,
            },
            datos_extraidos: datosExtraidos,
            validacion_bd: validacion,
            texto_completo: texto.substring(0, 1000) + (texto.length > 1000 ? '...' : ''),
          };
        } catch (error: any) {
          this.logger.error(`Error al procesar PDF: ${error.message}`);
          return {
            success: false,
            error: `No se pudo procesar el PDF: ${error.message}`,
            sugerencia: 'Asegúrese de que el archivo sea un PDF válido y esté correctamente codificado en base64',
          };
        }
      },
    });

    // Analizar documento de licencia/identificación
    this.mcpTools.registerTool({
      name: 'analizar_documento_pdf',
      description: 'Analiza documentos PDF como licencias de conducir, registros vehiculares o comprobantes de pago para extraer información relevante.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          pdf_base64: {
            type: 'string',
            description: 'Contenido del archivo PDF codificado en base64',
          },
          tipo_documento: {
            type: 'string',
            description: 'Tipo de documento a analizar',
            enum: ['licencia_conducir', 'registro_vehicular', 'comprobante_pago', 'poliza_seguro', 'otro'],
          },
          cliente_id: {
            type: 'string',
            description: 'ID del cliente para asociar el documento (opcional)',
          },
        },
        required: ['pdf_base64', 'tipo_documento'],
      },
      handler: async (params) => {
        try {
          const pdfBuffer = Buffer.from(params.pdf_base64, 'base64');
          const pdfData = await pdf(pdfBuffer);
          const texto = pdfData.text;

          let datosExtraidos: any = {
            tipo_documento: params.tipo_documento,
            paginas: pdfData.numpages,
          };

          // Extraer campos según el tipo de documento
          switch (params.tipo_documento) {
            case 'licencia_conducir':
              datosExtraidos = {
                ...datosExtraidos,
                numero_licencia: this.extraerCampo(texto, /(?:Licencia|License|No\.|Número)[\s:#]*([A-Z0-9\-]+)/i),
                nombre_titular: this.extraerCampo(texto, /(?:Nombre|Name|Titular)[\s:#]*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)/i),
                fecha_expedicion: this.extraerCampo(texto, /(?:Expedición|Issue|Emitido)[\s:#]*([\d\/\-]+)/i),
                fecha_vencimiento: this.extraerCampo(texto, /(?:Vencimiento|Expires|Válido hasta)[\s:#]*([\d\/\-]+)/i),
                categoria: this.extraerCampo(texto, /(?:Categoría|Category|Tipo)[\s:#]*([A-Z0-9]+)/i),
              };
              break;

            case 'registro_vehicular':
              datosExtraidos = {
                ...datosExtraidos,
                placa: this.extraerCampo(texto, /(?:Placa|Plate|Matrícula)[\s:#]*([A-Z0-9\-]+)/i),
                vin: this.extraerCampo(texto, /(?:VIN|Chasis|Serie)[\s:#]*([A-Z0-9]{17})/i),
                marca: this.extraerCampo(texto, /(?:Marca|Make|Brand)[\s:#]*([A-Za-z]+)/i),
                modelo: this.extraerCampo(texto, /(?:Modelo|Model)[\s:#]*([A-Za-z0-9\s]+)/i),
                año: this.extraerCampo(texto, /(?:Año|Year)[\s:#]*(\d{4})/i),
                propietario: this.extraerCampo(texto, /(?:Propietario|Owner|Titular)[\s:#]*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)/i),
              };
              break;

            case 'comprobante_pago':
              datosExtraidos = {
                ...datosExtraidos,
                numero_comprobante: this.extraerCampo(texto, /(?:Comprobante|Receipt|Factura|No\.)[\s:#]*([A-Z0-9\-]+)/i),
                monto: this.extraerCampo(texto, /(?:Total|Monto|Amount)[\s:#$]*(\d+[.,]?\d*)/i),
                fecha_pago: this.extraerCampo(texto, /(?:Fecha|Date)[\s:#]*([\d\/\-]+)/i),
                metodo_pago: this.extraerCampo(texto, /(?:Método|Method|Pago con)[\s:#]*([A-Za-z]+)/i),
              };
              break;

            case 'poliza_seguro':
              datosExtraidos = {
                ...datosExtraidos,
                numero_poliza: this.extraerCampo(texto, /(?:Póliza|Policy|No\.)[\s:#]*([A-Z0-9\-]+)/i),
                aseguradora: this.extraerCampo(texto, /(?:Aseguradora|Insurer|Compañía)[\s:#]*([A-Za-z\s]+)/i),
                vigencia_desde: this.extraerCampo(texto, /(?:Desde|From|Inicio)[\s:#]*([\d\/\-]+)/i),
                vigencia_hasta: this.extraerCampo(texto, /(?:Hasta|To|Fin|Vence)[\s:#]*([\d\/\-]+)/i),
                cobertura: this.extraerCampo(texto, /(?:Cobertura|Coverage)[\s:#]*([A-Za-z\s]+)/i),
              };
              break;

            default:
              datosExtraidos.texto_extraido = texto.substring(0, 2000);
          }

          return {
            success: true,
            datos: datosExtraidos,
            confianza: this.calcularConfianzaExtraccion(datosExtraidos),
            cliente_id: params.cliente_id || null,
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Error al analizar documento: ${error.message}`,
          };
        }
      },
    });
  }

  // ============ MÉTODOS AUXILIARES PARA PDF ============

  private extraerDatosTicketPDF(texto: string): any {
    return {
      ticketId: this.extraerCampo(texto, /(?:Ticket|ID|Número)[\s:#]*([a-f0-9\-]{36}|[A-Z0-9\-]+)/i),
      placa: this.extraerCampo(texto, /(?:Placa|Plate|Vehículo)[\s:#]*([A-Z0-9\-]+)/i),
      fechaIngreso: this.extraerCampo(texto, /(?:Entrada|Ingreso|Entry|Check-in)[\s:#]*([\d\/\-\s:]+)/i),
      fechaSalida: this.extraerCampo(texto, /(?:Salida|Exit|Check-out)[\s:#]*([\d\/\-\s:]+)/i),
      espacio: this.extraerCampo(texto, /(?:Espacio|Space|Lugar|Slot)[\s:#]*([A-Z0-9\-]+)/i),
      monto: this.extraerCampo(texto, /(?:Total|Monto|Amount|Pagar)[\s:#$]*(\d+[.,]?\d*)/i),
      estado: this.extraerCampo(texto, /(?:Estado|Status)[\s:#]*([A-Za-z]+)/i),
    };
  }

  private extraerCampo(texto: string, regex: RegExp): string | null {
    const match = texto.match(regex);
    return match ? match[1].trim() : null;
  }

  private calcularConfianzaExtraccion(datos: any): number {
    const campos = Object.values(datos).filter(v => v !== null && typeof v !== 'number');
    const camposEncontrados = campos.filter(v => v !== null).length;
    return Math.round((camposEncontrados / campos.length) * 100);
  }

  private async validarTicketEnBD(datosExtraidos: any): Promise<any> {
    try {
      let ticketEnBD = null;

      // Buscar por ID si existe
      if (datosExtraidos.ticketId) {
        const response = await fetch(`${this.parkingApiUrl}/tickets/${datosExtraidos.ticketId}`);
        if (response.ok) {
          ticketEnBD = await response.json();
        }
      }

      // Si no se encontró por ID, buscar por placa en tickets activos
      if (!ticketEnBD && datosExtraidos.placa) {
        const response = await fetch(`${this.parkingApiUrl}/tickets`);
        if (response.ok) {
          const tickets = await response.json();
          ticketEnBD = tickets.find((t: any) => 
            t.vehiculo?.placa?.toLowerCase() === datosExtraidos.placa.toLowerCase() ||
            t.vehiculoId === datosExtraidos.placa
          );
        }
      }

      if (ticketEnBD) {
        // Comparar datos
        const coincidencias = {
          ticketId: ticketEnBD.id === datosExtraidos.ticketId,
          monto: datosExtraidos.monto ? 
            Math.abs(parseFloat(ticketEnBD.montoCalculado || 0) - parseFloat(datosExtraidos.monto)) < 0.01 : null,
        };

        return {
          encontrado: true,
          ticket_bd: {
            id: ticketEnBD.id,
            fechaIngreso: ticketEnBD.fechaIngreso,
            fechaSalida: ticketEnBD.fechaSalida,
            montoCalculado: ticketEnBD.montoCalculado,
            espacioId: ticketEnBD.espacioId,
          },
          coincidencias,
          verificado: Object.values(coincidencias).every(v => v === true || v === null),
        };
      }

      return {
        encontrado: false,
        mensaje: 'No se encontró el ticket en la base de datos',
        datos_buscados: {
          ticketId: datosExtraidos.ticketId,
          placa: datosExtraidos.placa,
        },
      };
    } catch (error: any) {
      return {
        encontrado: false,
        error: `Error al validar en BD: ${error.message}`,
      };
    }
  }
}
