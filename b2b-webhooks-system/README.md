# 🤖 Sistema B2B con Webhooks y Chatbot MCP Multimodal

Sistema de integración empresarial B2B para el estacionamiento con infraestructura de webhooks y chatbot inteligente usando Google Gemini AI.

## 📋 Índice

- [Arquitectura](#arquitectura)
- [Características](#características)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [API Reference](#api-reference)
- [Webhooks B2B](#webhooks-b2b)
- [Chatbot MCP](#chatbot-mcp)
- [Testing](#testing)
- [Despliegue](#despliegue)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Angular)                          │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Dashboard       │  │  B2B Chat        │                    │
│  │  Components      │  │  Component       │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│               B2B WEBHOOKS SERVICE (NestJS)                    │
│  Port: 3001                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Webhooks   │ │   Events    │ │   Payment   │              │
│  │  Controller │ │   Engine    │ │   Adapters  │              │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘              │
│         │               │               │                      │
│  ┌──────▼───────────────▼───────────────▼──────┐              │
│  │           MCP ORCHESTRATOR                   │              │
│  │  ┌────────────────┐ ┌────────────────┐      │              │
│  │  │  AI Orchestr.  │ │  MCP Tools     │      │              │
│  │  │  (Gemini)      │ │  (10+ tools)   │      │              │
│  │  └────────────────┘ └────────────────┘      │              │
│  └─────────────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│               EXISTING PARKING API (Port 3000)                 │
│  /espacios  /tickets  /vehiculos  /detalle-pago               │
└───────────────────────────────────────────────────────────────┘
```

## ✨ Características

### 🔗 Webhooks B2B
- **Seguridad HMAC-SHA256**: Firmas con comparación timing-safe
- **Protección contra replay attacks**: Nonces únicos + timestamps
- **Tolerancia de 5 minutos**: Para sincronización de relojes
- **Eventos del estacionamiento**: reserve, enter, exit, payment
- **Dead Letter Queue**: Reintentos con backoff exponencial
- **Simulador integrado**: Para testing de integraciones

### 🤖 Chatbot MCP Multimodal
- **Google Gemini 1.5 Flash**: Modelo de IA avanzado
- **10+ Herramientas MCP**: Operaciones especializadas
- **Procesamiento multimodal**: Imágenes (OCR) y PDFs
- **Sesiones persistentes**: Contexto de conversación
- **Respuestas iterativas**: Hasta 5 llamadas a herramientas

### 💳 Sistema de Pagos
- **Patrón Adapter**: Mock y Stripe
- **Circuit Breaker**: Resiliencia automática
- **Webhooks de pago**: success, failed, refunded

## 🚀 Instalación

### Requisitos Previos
- Node.js 20+
- npm 10+
- PostgreSQL (Supabase)

### Pasos

```bash
# Clonar e instalar
cd b2b-webhooks-system
npm install

# Configurar variables
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar en desarrollo
npm run start:dev

# El servicio estará en http://localhost:3001
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db

# API de estacionamiento
PARKING_API_URL=http://localhost:3000

# Gemini AI
GEMINI_API_KEY=tu_api_key_principal
GEMINI_API_KEY_BACKUP=tu_api_key_backup

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Servidor
PORT=3001
NODE_ENV=development
```

## 📡 API Reference

### Health Check
```http
GET /health
```

### Partners B2B

#### Registrar Partner
```http
POST /partners
Content-Type: application/json

{
  "name": "Mi Empresa",
  "webhookUrl": "https://mi-empresa.com/webhook",
  "email": "contacto@empresa.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Mi Empresa",
  "apiKey": "b2b_xxx",
  "hmacSecret": "base64_secret",
  "webhookUrl": "https://mi-empresa.com/webhook",
  "isActive": true
}
```

#### Listar Partners
```http
GET /partners
```

#### Verificar Autenticación
```http
POST /partners/verify-auth
X-API-Key: b2b_xxx
X-Timestamp: 1234567890123
X-Nonce: unique_nonce
X-Signature: hmac_signature

{
  "test": true
}
```

### Webhooks

#### Recibir Webhook (para partners)
```http
POST /webhooks/receive
X-API-Key: b2b_xxx
X-Timestamp: 1234567890123
X-Nonce: unique_nonce
X-Signature: hmac_signature

{
  "eventType": "parking.reserved",
  "data": { ... }
}
```

#### Simular Evento
```http
POST /webhooks/simulate
Content-Type: application/json

{
  "partnerId": "uuid",
  "eventType": "parking.entered",
  "data": {
    "placa": "ABC-123",
    "espacioId": 5
  }
}
```

#### Simular Ciclo Completo
```http
POST /webhooks/simulate-full-cycle
Content-Type: application/json

{
  "partnerId": "uuid",
  "placa": "XYZ-789"
}
```

### Eventos

#### Listar Eventos
```http
GET /events?status=pending&limit=50
```

#### Estadísticas
```http
GET /events/stats
```

### Chat MCP

#### Enviar Mensaje
```http
POST /mcp/chat
Content-Type: application/json

{
  "message": "¿Cuántos espacios hay disponibles?",
  "sessionId": "optional_session_id"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "message": "Actualmente hay 15 espacios disponibles:\n- Zona A: 5 espacios\n- Zona B: 3 espacios VIP\n..."
}
```

#### Chat con Archivos (Multimodal)
```http
POST /mcp/chat/multimodal
Content-Type: multipart/form-data

message: "¿Qué placa aparece en esta imagen?"
sessionId: "optional"
files: [image.jpg]
```

#### Listar Herramientas
```http
GET /mcp/tools
```

#### Ejecutar Herramienta Directamente
```http
POST /mcp/tools/buscar_espacios/execute
Content-Type: application/json

{
  "zona": "A",
  "soloDisponibles": true
}
```

## 🔐 Webhooks B2B

### Estructura de Evento

```json
{
  "id": "evt_uuid",
  "type": "parking.entered",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "ticketId": 1234,
    "placa": "ABC-123",
    "espacioId": 5,
    "zona": "A"
  },
  "partnerId": "partner_uuid"
}
```

### Tipos de Eventos

| Evento | Descripción |
|--------|-------------|
| `parking.reserved` | Espacio reservado |
| `parking.entered` | Vehículo ingresó |
| `parking.exited` | Vehículo salió |
| `payment.success` | Pago exitoso |
| `payment.failed` | Pago fallido |
| `payment.refunded` | Reembolso procesado |

### Verificar Firma (Tu Servidor)

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, headers, secret) {
  const { 'x-timestamp': timestamp, 'x-nonce': nonce, 'x-signature': signature } = headers;
  
  // Verificar timestamp (5 min tolerancia)
  const age = Date.now() - parseInt(timestamp);
  if (age > 300000 || age < -60000) {
    return { valid: false, error: 'Timestamp expired' };
  }
  
  // Reconstruir firma
  const signaturePayload = `${timestamp}.${nonce}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
  
  // Comparación timing-safe
  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
  
  return { valid };
}
```

## 🛠️ Herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `buscar_espacios` | Buscar espacios por zona/estado |
| `ver_ticket` | Consultar ticket por ID o placa |
| `crear_reserva` | Reservar espacio |
| `procesar_pago` | Procesar pago |
| `resumen_recaudacion` | Estadísticas de ingresos |
| `registrar_partner` | Registrar partner B2B |
| `listar_partners` | Ver partners activos |
| `simular_evento_partner` | Simular webhook |
| `estadisticas_eventos` | Métricas de webhooks |
| `diagnosticar_webhook` | Solucionar problemas |

### Ejemplo de Conversación

```
Usuario: "¿Cuántos espacios disponibles hay en la zona A?"

Bot: 🅿️ **Espacios en Zona A**
     
     Encontré 5 espacios disponibles:
     - Espacio #1 (Normal) ✅
     - Espacio #3 (Normal) ✅
     - Espacio #7 (Normal) ✅
     - Espacio #9 (VIP) ✅
     - Espacio #12 (Normal) ✅
     
     ¿Deseas reservar alguno?
```

## 🧪 Testing

### Probar Chat

```bash
# Mensaje simple
curl -X POST http://localhost:3001/mcp/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿qué puedes hacer?"}'

# Con imagen (OCR)
curl -X POST http://localhost:3001/mcp/chat/multimodal \
  -F "message=¿Qué placa aparece aquí?" \
  -F "files=@placa.jpg"
```

### Probar Webhooks

```bash
# Registrar partner
curl -X POST http://localhost:3001/partners \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Partner", "webhookUrl": "https://webhook.site/xxx"}'

# Simular evento
curl -X POST http://localhost:3001/webhooks/simulate \
  -H "Content-Type: application/json" \
  -d '{"partnerId": "PARTNER_ID", "eventType": "parking.entered", "data": {"placa": "ABC-123"}}'
```

## 🐳 Despliegue

### Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d b2b-webhooks

# Ver logs
docker-compose logs -f b2b-webhooks
```

### Variables de Producción

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
```

## 📊 Monitoreo

### Endpoints de Salud

- `GET /health` - Estado general
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Métricas

```http
GET /mcp/stats
```

```json
{
  "sessions": {
    "active": 5,
    "total": 150
  },
  "tools": {
    "executions": 1234,
    "errors": 12
  },
  "ai": {
    "requests": 500,
    "fallbacks": 3
  }
}
```

## 🔧 Troubleshooting

### Error: "Invalid signature"
- Verificar que el HMAC secret sea correcto
- Verificar que el timestamp esté en milisegundos
- Asegurar que el payload sea JSON válido

### Error: "Timestamp expired"
- Sincronizar relojes con NTP
- El timestamp debe estar dentro de ±5 minutos

### Error: "AI service unavailable"
- Verificar API keys de Gemini
- El sistema usa backup automático

## 📄 Licencia

MIT © 2024 - Sistema de Estacionamiento

---

Desarrollado con ❤️ usando NestJS, Google Gemini y TypeORM
