# 📚 Documentación de Servicios - B2B Webhooks System

> **Sistema de Gestión de Estacionamiento B2B**  
> Documentación generada: 21 de enero de 2026

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulo AI - Inteligencia Artificial](#módulo-ai---inteligencia-artificial)
4. [Módulo MCP - Model Context Protocol](#módulo-mcp---model-context-protocol)
5. [Módulo Partners - Gestión de Partners B2B](#módulo-partners---gestión-de-partners-b2b)
6. [Módulo Events - Motor de Eventos](#módulo-events---motor-de-eventos)
7. [Módulo Payments - Procesamiento de Pagos](#módulo-payments---procesamiento-de-pagos)
8. [Módulo Webhooks - Sistema de Webhooks](#módulo-webhooks---sistema-de-webhooks)
9. [Patrones de Diseño Utilizados](#patrones-de-diseño-utilizados)
10. [Variables de Entorno](#variables-de-entorno)
11. [API Endpoints](#api-endpoints)

---

## 🎯 Visión General

Este proyecto es un **Sistema de Gestión de Estacionamiento B2B** que integra:

- **API REST** para gestión de estacionamiento
- **Sistema de webhooks** para integración empresarial
- **Chatbot inteligente con IA** (MCP - Model Context Protocol)
- **Soporte multimodal** (imágenes, PDFs, audio)
- **Múltiples proveedores de IA** intercambiables (Gemini, OpenAI, Anthropic)

### Tecnologías Principales

| Componente | Tecnología |
|------------|------------|
| Backend Principal | NestJS (TypeScript) |
| Base de Datos | PostgreSQL (Supabase) |
| ORM | TypeORM |
| IA | Google Gemini, OpenAI GPT, Anthropic Claude |
| Documentación | Swagger/OpenAPI |
| Validación | class-validator, class-transformer |

---

## 🏛️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular)                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  Dashboard     │  │  B2B Chat      │  │  Admin Panel   │             │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘             │
└──────────┼───────────────────┼───────────────────┼──────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    B2B WEBHOOKS SERVICE (NestJS)                         │
│                           Puerto: 3001                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      AI MODULE                                   │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │              LlmStrategyService (Patrón Strategy)       │    │    │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │    │    │
│  │  │  │   Gemini    │ │   OpenAI    │ │  Anthropic  │       │    │    │
│  │  │  │  Provider   │ │  Provider   │ │  Provider   │       │    │    │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘       │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │  ┌────────────────────┐ ┌────────────────────┐                  │    │
│  │  │  AI Orchestrator   │ │ Multimodal Proc.   │                  │    │
│  │  └────────────────────┘ └────────────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      MCP MODULE                                  │    │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │    │
│  │  │  McpTools      │ │ BusinessTools  │ │ ParkingTools   │       │    │
│  │  │  Service       │ │ Service        │ │ Service        │       │    │
│  │  └────────────────┘ └────────────────┘ └────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   Partners   │ │    Events    │ │   Webhooks   │ │   Payments   │    │
│  │   Module     │ │   Module     │ │    Module    │ │   Module     │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   PARKING REST API (Puerto: 3000)                        │
│  /espacios  /tickets  /vehiculos  /clientes  /detalle-pago              │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL (Supabase)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Módulo AI - Inteligencia Artificial

### Ubicación
`src/ai/`

### Archivos

| Archivo | Descripción |
|---------|-------------|
| `ai.module.ts` | Módulo principal que agrupa todos los servicios de IA |
| `ai-orchestrator.service.ts` | Orquestador del chatbot MCP |
| `gemini-adapter.service.ts` | Adaptador legacy para Gemini (compatibilidad) |
| `multimodal-processor.service.ts` | Procesamiento de imágenes, PDFs, OCR |
| `llm-provider.interface.ts` | Interfaz Strategy para proveedores de IA |
| `llm-strategy.service.ts` | Contexto Strategy que gestiona proveedores |
| `providers/gemini.provider.ts` | Implementación para Google Gemini |
| `providers/openai.provider.ts` | Implementación para OpenAI GPT |
| `providers/anthropic.provider.ts` | Implementación para Anthropic Claude |

### AiOrchestratorService

**Responsabilidad:** Orquesta las conversaciones del chatbot MCP.

```typescript
// Funcionalidades principales:
- createSession(): Crea una nueva sesión de chat
- getOrCreateSession(): Obtiene o crea una sesión
- processMessage(): Procesa mensajes del usuario (texto + archivos)
- getSessionHistory(): Obtiene el historial de una sesión
- cleanupSessions(): Limpia sesiones inactivas
```

**Características:**
- Gestión de sesiones de chat con historial
- Integración con herramientas MCP
- Soporte multimodal (imágenes, PDFs)
- System prompts dinámicos según rol de usuario

### LlmStrategyService (Patrón Strategy)

**Responsabilidad:** Gestiona múltiples proveedores de IA con fallback automático.

```typescript
// Uso básico:
const response = await this.llmStrategy.generateResponse(
  messages,
  tools,
  systemPrompt,
);

// Cambiar proveedor dinámicamente:
this.llmStrategy.setProvider('openai');

// Verificar salud de todos los proveedores:
const health = await this.llmStrategy.checkHealth();

// Obtener estadísticas:
const stats = this.llmStrategy.getStats();
```

**Beneficios:**
1. **Intercambiabilidad:** Cambiar de proveedor sin modificar código
2. **Fallback automático:** Si Gemini falla, usa OpenAI, luego Anthropic
3. **Extensibilidad:** Fácil agregar nuevos proveedores
4. **Configuración dinámica:** Cambiar proveedor en runtime
5. **Alta disponibilidad:** Sistema resiliente ante fallos

### MultimodalProcessorService

**Responsabilidad:** Procesa diferentes tipos de entrada con IA.

```typescript
// Capacidades:
- processText(): Procesa texto plano con detección de entidades
- processImage(): OCR con Tesseract.js + análisis con Gemini Vision
- processPdf(): Extracción de texto de PDFs
- processFile(): Detector automático de tipo de archivo
```

**Entidades detectadas:**
- Placas vehiculares (formato boliviano)
- Montos en bolivianos (Bs.)
- IDs de tickets
- Fechas y horas
- Espacios de estacionamiento

---

## 🔧 Módulo MCP - Model Context Protocol

### Ubicación
`src/mcp/`

### Archivos

| Archivo | Descripción |
|---------|-------------|
| `mcp.module.ts` | Módulo principal MCP |
| `mcp.controller.ts` | API REST para el chatbot |
| `mcp-tools.service.ts` | Registro y ejecución de herramientas |
| `business-tools.service.ts` | Herramientas de negocio B2B |
| `parking-tools.service.ts` | Herramientas de estacionamiento |

### McpToolsService

**Responsabilidad:** Registro dinámico y ejecución de herramientas MCP.

```typescript
interface McpTool {
  name: string;
  description: string;
  parameters: { type, properties, required };
  handler: (params) => Promise<any>;
  timeout?: number;
  allowedRoles?: string[];
}
```

**API:**
- `registerTool()`: Registra una herramienta
- `getToolsDefinition()`: Obtiene herramientas filtradas por rol
- `executeTool()`: Ejecuta una herramienta con validación

### Herramientas Disponibles

| Herramienta | Descripción | Roles |
|-------------|-------------|-------|
| `buscar_espacios` | Buscar espacios por zona/estado | admin, operator |
| `ver_ticket` | Consultar ticket por ID/placa | admin, operator |
| `buscar_cliente` | Buscar cliente por email/nombre/placa | admin, operator |
| `registrar_ingreso` | Registrar entrada de vehículo | admin, operator |
| `registrar_salida` | Registrar salida y cobro | admin, operator |
| `procesar_pago` | Procesar pago de ticket | admin |
| `resumen_recaudacion` | Estadísticas de ingresos | admin |
| `registrar_partner` | Registrar partner B2B | admin |
| `listar_partners` | Ver partners activos | admin |
| `simular_evento_partner` | Simular webhook | admin |

---

## 👥 Módulo Partners - Gestión de Partners B2B

### Ubicación
`src/partners/`

### PartnersService

**Responsabilidad:** Gestión completa de partners B2B con seguridad HMAC.

```typescript
// Funcionalidades:
- register(): Registra partner y genera credenciales
- authenticate(): Autentica por API Key
- validateSignature(): Valida firma HMAC de requests
- generateWebhookSignature(): Genera firma para webhooks salientes
```

### Seguridad

1. **API Keys:** Generación única de 32 caracteres
2. **HMAC-SHA256:** Firmas para autenticidad
3. **Nonces:** Protección contra replay attacks
4. **Timestamps:** Tolerancia configurable (default: 5 minutos)

### Flujo de Registro

```typescript
// 1. Registrar partner
const credentials = await partnersService.register({
  name: 'Partner XYZ',
  email: 'contact@xyz.com',
  webhookUrl: 'https://xyz.com/webhooks',
});

// 2. Respuesta con credenciales (una sola vez)
{
  apiKey: 'pk_xxx...',
  apiSecret: 'sk_xxx...', // Solo se muestra aquí
  webhookSecret: 'wh_xxx...', // Solo se muestra aquí
}
```

---

## 📡 Módulo Events - Motor de Eventos

### Ubicación
`src/events/`

### EventsService

**Responsabilidad:** Motor de eventos con reintentos y dead letter queue.

```typescript
// Funcionalidades:
- emit(): Emite un nuevo evento
- deliverEvent(): Intenta entregar evento a partner
- processDeadLetter(): Procesa eventos en dead letter
- getEventsByPartner(): Obtiene eventos de un partner
```

### Estados de Evento

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Esperando entrega |
| `PROCESSING` | Entrega en proceso |
| `DELIVERED` | Entregado exitosamente |
| `FAILED` | Falló, pendiente de reintento |
| `DEAD_LETTER` | Máximo de reintentos alcanzado |

### Tipos de Eventos

- `parking.reserved` - Espacio reservado
- `parking.entered` - Vehículo ingresó
- `parking.exited` - Vehículo salió
- `payment.success` - Pago exitoso
- `payment.failed` - Pago fallido
- `payment.refunded` - Reembolso procesado

### Política de Reintentos

Backoff exponencial: `[1s, 5s, 30s, 5m, 15m]`

```typescript
// Configuración por partner
{
  retryPolicy: {
    maxRetries: 5,
    backoffMultiplier: 2,
  }
}
```

---

## 💳 Módulo Payments - Procesamiento de Pagos

### Ubicación
`src/payments/`

### PaymentService

**Responsabilidad:** Wrapper con circuit breaker para adaptadores de pago.

```typescript
// Funcionalidades:
- processPayment(): Procesa pago con retry y fallback
- refundPayment(): Procesa reembolso
- getTransactionStatus(): Obtiene estado de transacción
- verifyWebhookSignature(): Verifica webhooks de proveedores
```

### Adaptadores

| Adaptador | Descripción |
|-----------|-------------|
| `MockPaymentAdapter` | Simulación para desarrollo |
| `StripePaymentAdapter` | Integración con Stripe |

### Circuit Breaker

```typescript
// Estados:
- closed: Funcionando normalmente
- open: Demasiados fallos, usando fallback
- half-open: Intentando recuperar

// Configuración:
- failureThreshold: 5 fallos
- resetTimeout: 30 segundos
```

---

## 🔗 Módulo Webhooks - Sistema de Webhooks

### Ubicación
`src/webhooks/`

### Flujo de Webhooks

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Partner   │     │   Events    │     │   Webhook   │
│   Trigger   │────▶│   Service   │────▶│   Delivery  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Dead Letter │
                    │   Queue     │
                    └─────────────┘
```

### Headers de Webhook

```http
X-Webhook-Signature: sha256=...
X-Webhook-Timestamp: 1705842600
X-Webhook-Nonce: abc123...
X-Webhook-Event: parking.entered
```

### Verificación de Firma

```typescript
// En el cliente:
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${nonce}.${JSON.stringify(body)}`)
  .digest('hex');

const isValid = signature === `sha256=${expectedSignature}`;
```

---

## 🎯 Patrones de Diseño Utilizados

### 1. Strategy Pattern (Proveedores de LLM)

```typescript
// Interfaz
interface ILlmProvider {
  providerName: string;
  initialize(config): void;
  generateResponse(messages, tools, prompt): Promise<LlmResponse>;
  isHealthy(): Promise<boolean>;
  isInitialized(): boolean;
}

// Implementaciones
class GeminiProvider implements ILlmProvider { ... }
class OpenAIProvider implements ILlmProvider { ... }
class AnthropicProvider implements ILlmProvider { ... }

// Contexto
class LlmStrategyService {
  private providers = new Map<string, ILlmProvider>();
  private currentProvider = 'gemini';
  
  setProvider(name: string) { ... }
  generateResponse(...) { /* usa currentProvider */ }
}
```

### 2. Adapter Pattern (Pagos)

```typescript
// Interfaz común
interface IPaymentAdapter {
  processPayment(request): Promise<PaymentResult>;
  refundPayment(request): Promise<PaymentResult>;
}

// Adaptadores específicos
class StripePaymentAdapter implements IPaymentAdapter { ... }
class MockPaymentAdapter implements IPaymentAdapter { ... }
```

### 3. Circuit Breaker Pattern

Implementado en `PaymentService` y `GeminiAdapterService` para manejar fallos de servicios externos.

### 4. Factory Pattern

Usado en la creación de herramientas MCP dinámicamente.

---

## ⚙️ Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_SSL=false

# API de estacionamiento
PARKING_API_URL=http://localhost:3000

# Proveedores de IA
GEMINI_API_KEY=xxx
GEMINI_API_KEY_BACKUP=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# Configuración de Strategy
LLM_PRIMARY_PROVIDER=gemini
LLM_FALLBACK_ORDER=openai,anthropic
LLM_AUTO_FALLBACK=true

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_xxx

# Servidor
PORT=3001
NODE_ENV=development

# Seguridad
HMAC_TOLERANCE_MINUTES=5
NONCE_EXPIRY_MINUTES=10
```

---

## 🌐 API Endpoints

### Health Check

```http
GET /health          # Estado general
GET /health/ready    # Readiness probe
GET /health/live     # Liveness probe
```

### MCP (Chatbot)

```http
POST /mcp/chat       # Enviar mensaje al chatbot
GET  /mcp/tools      # Listar herramientas disponibles
GET  /mcp/stats      # Estadísticas del chatbot
```

### Partners

```http
POST   /partners/register   # Registrar nuevo partner
GET    /partners            # Listar partners
GET    /partners/:id        # Obtener partner
PUT    /partners/:id        # Actualizar partner
DELETE /partners/:id        # Eliminar partner
```

### Webhooks

```http
POST /webhooks/receive    # Recibir webhook de partner
POST /webhooks/send       # Enviar webhook a partner
```

### Events

```http
GET  /events              # Listar eventos
GET  /events/:id          # Obtener evento
POST /events/emit         # Emitir evento
GET  /events/monitor      # Dashboard de eventos
```

### Payments

```http
POST /payments/process    # Procesar pago
POST /payments/refund     # Procesar reembolso
GET  /payments/:id        # Estado de transacción
POST /payments/webhook    # Webhook de Stripe
```

---

## 📊 Monitoreo y Logging

### Servicios con Logging

| Servicio | Tipos de Log |
|----------|--------------|
| `GeminiAdapterService` | Inicialización, errores, reintentos |
| `AiOrchestratorService` | Procesamiento de mensajes, duración |
| `MultimodalProcessorService` | OCR, procesamiento de archivos |
| `McpToolsService` | Registro y ejecución de herramientas |
| `BusinessToolsService` | Operaciones de negocio |
| `ParkingToolsService` | Operaciones de estacionamiento |
| `LlmStrategyService` | Fallbacks, cambios de proveedor |

### Formato de Log

```
[Nest] 12345  - 01/21/2026, 10:30:00 AM     LOG [GeminiProvider] Gemini AI inicializado correctamente
[Nest] 12345  - 01/21/2026, 10:30:05 AM    WARN [LlmStrategyService] Fallback usado: openai (primario: gemini)
[Nest] 12345  - 01/21/2026, 10:30:10 AM   ERROR [AnthropicProvider] Error: API rate limit exceeded
```

### Métricas del LLM Strategy

```json
{
  "totalRequests": 1500,
  "requestsByProvider": {
    "gemini": 1400,
    "openai": 95,
    "anthropic": 5
  },
  "fallbacksTriggered": 100,
  "errors": 12,
  "currentProvider": "gemini",
  "availableProviders": ["gemini", "openai", "anthropic"]
}
```

---

## 🎓 Conclusión

Este proyecto implementa una arquitectura moderna y robusta que:

1. **Alta Abstracción:** Interfaces y patrones de diseño (Strategy, Adapter)
2. **Resiliencia:** Fallback automático entre proveedores de IA
3. **Extensibilidad:** Fácil agregar nuevos proveedores o herramientas
4. **Escalabilidad:** Microservicios independientes
5. **Mantenibilidad:** Código modular y bien documentado

El patrón Strategy para proveedores de LLM garantiza que el sistema funcione incluso si un proveedor falla, manteniendo alta disponibilidad del chatbot.

---

*Documentación generada el 21 de enero de 2026*
