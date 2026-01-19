# 🚀 Guía de Despliegue: Sistema B2B Partners en Vercel

## 📋 Índice
1. [Prerrequisitos](#prerrequisitos)
2. [Preparación del Proyecto](#preparación-del-proyecto)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Despliegue en Vercel](#despliegue-en-vercel)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificación del Despliegue](#verificación-del-despliegue)
7. [Uso de la API de Partners](#uso-de-la-api-de-partners)
8. [Troubleshooting](#troubleshooting)

---

## 1. Prerrequisitos

### Cuentas necesarias:
- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [Supabase](https://supabase.com) o [Neon](https://neon.tech) (PostgreSQL gratuito)
- ✅ Repositorio en GitHub/GitLab/Bitbucket

### Herramientas locales:
```bash
node -v   # v18.x o superior
npm -v    # v9.x o superior
```

---

## 2. Preparación del Proyecto

### 2.1 Crear archivo `vercel.json` en `b2b-webhooks-system/`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ]
}
```

### 2.2 Modificar `src/main.ts` para Vercel

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS para producción
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger (opcional en producción)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('B2B Partners API')
      .setDescription('API para gestión de partners B2B')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 B2B API running on port ${port}`);
}

bootstrap();
```

### 2.3 Actualizar `package.json`

Agregar script de build para Vercel:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:prod": "node dist/main.js",
    "vercel-build": "npm run build"
  }
}
```

### 2.4 Build local para verificar

```bash
cd b2b-webhooks-system
npm install
npm run build
```

---

## 3. Configuración de Base de Datos

### Opción A: Supabase (Recomendado - Gratis)

1. Ir a [supabase.com](https://supabase.com) y crear proyecto
2. En **Settings > Database**, copiar la **Connection string (URI)**
3. El formato será:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### Opción B: Neon (Alternativa gratuita)

1. Ir a [neon.tech](https://neon.tech) y crear proyecto
2. Copiar la **Connection string** del dashboard

### Opción C: Railway

1. Ir a [railway.app](https://railway.app)
2. Crear nuevo proyecto > Add PostgreSQL
3. Copiar `DATABASE_URL` de las variables

---

## 4. Despliegue en Vercel

### 4.1 Método CLI (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Navegar al proyecto
cd b2b-webhooks-system

# Desplegar
vercel

# Para producción
vercel --prod
```

### 4.2 Método Dashboard

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar repositorio de GitHub
3. Configurar:
   - **Framework Preset**: Other
   - **Root Directory**: `b2b-webhooks-system`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 5. Variables de Entorno

### Configurar en Vercel Dashboard > Settings > Environment Variables

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Entorno de ejecución |
| `DATABASE_URL` | `postgresql://...` | URL de conexión PostgreSQL |
| `HMAC_TOLERANCE_MINUTES` | `5` | Tolerancia de tiempo para HMAC |
| `NONCE_EXPIRY_MINUTES` | `10` | Expiración de nonces |
| `ALLOWED_ORIGINS` | `https://tuapp.vercel.app` | Orígenes CORS permitidos |
| `GEMINI_API_KEY` | `AIza...` | (Opcional) Para chatbot AI |
| `STRIPE_SECRET_KEY` | `sk_live_...` | (Opcional) Para pagos |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | (Opcional) Para webhooks Stripe |

### Ejemplo de `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
HMAC_TOLERANCE_MINUTES=5
NONCE_EXPIRY_MINUTES=10
ALLOWED_ORIGINS=https://parking-app.vercel.app,https://partner-hotel.com
```

---

## 6. Verificación del Despliegue

### 6.1 Verificar que el servicio está corriendo

```bash
curl https://tu-proyecto.vercel.app/partners
```

Respuesta esperada:
```json
[]
```

### 6.2 Registrar un Partner de prueba

```bash
curl -X POST https://tu-proyecto.vercel.app/partners/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hotel Paradise Test",
    "type": "hotel",
    "webhookUrl": "https://webhook.site/tu-uuid"
  }'
```

Respuesta (GUARDAR ESTAS CREDENCIALES):
```json
{
  "partnerId": "550e8400-e29b-41d4-a716-446655440000",
  "apiKey": "pk_b2b_xxxxxxxxxxxxxxxxxxxx",
  "apiSecret": "sk_b2b_xxxxxxxxxxxxxxxxxxxx",
  "webhookSecret": "ws_b2b_xxxxxxxxxxxxxxxxxxxx",
  "message": "Partner registrado exitosamente. Guarda estas credenciales, no se mostrarán de nuevo."
}
```

### 6.3 Verificar autenticación HMAC

```bash
# Generar firma HMAC (ejemplo en Node.js)
node -e "
const crypto = require('crypto');
const timestamp = Date.now().toString();
const nonce = crypto.randomBytes(16).toString('hex');
const body = JSON.stringify({test: 'data'});
const message = timestamp + nonce + body;
const signature = crypto.createHmac('sha256', 'TU_API_SECRET').update(message).digest('hex');
console.log('Timestamp:', timestamp);
console.log('Nonce:', nonce);
console.log('Signature:', signature);
"
```

---

## 7. Uso de la API de Partners

### 7.1 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/partners/register` | Registrar nuevo partner |
| `GET` | `/partners` | Listar todos los partners |
| `GET` | `/partners/:id` | Obtener partner por ID |
| `PATCH` | `/partners/:id` | Actualizar partner |
| `PATCH` | `/partners/:id/status?status=active` | Cambiar estado |
| `POST` | `/partners/:id/rotate-credentials` | Rotar credenciales |
| `POST` | `/partners/verify-auth` | Verificar autenticación |
| `POST` | `/webhooks/receive` | Recibir webhooks (autenticado HMAC) |

### 7.2 Ejemplo: Enviar Webhook Autenticado

```javascript
const crypto = require('crypto');
const axios = require('axios');

const API_KEY = 'pk_b2b_xxx';
const API_SECRET = 'sk_b2b_xxx';
const WEBHOOK_URL = 'https://tu-proyecto.vercel.app/webhooks/receive';

async function sendWebhook(eventType, payload) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const body = JSON.stringify(payload);
  
  // Crear mensaje para firmar
  const message = timestamp + nonce + body;
  
  // Firmar con HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(message)
    .digest('hex');
  
  const response = await axios.post(WEBHOOK_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Webhook-Event': eventType
    }
  });
  
  return response.data;
}

// Uso
sendWebhook('parking.reserved', {
  reservationId: '123',
  guestName: 'John Doe',
  checkIn: '2026-01-20',
  vehiclePlate: 'ABC-123'
});
```

### 7.3 Tipos de Partner Soportados

```typescript
enum PartnerType {
  HOTEL = 'hotel',
  TOUR_OPERATOR = 'tour_operator',
  RESTAURANT = 'restaurant',
  PARKING_APP = 'parking_app',
  RESERVATION_SYSTEM = 'reservation_system',
  PAYMENT_GATEWAY = 'payment_gateway',
  OTHER = 'other'
}
```

### 7.4 Estados de Partner

```typescript
enum PartnerStatus {
  ACTIVE = 'active',      // Puede enviar/recibir webhooks
  INACTIVE = 'inactive',  // Deshabilitado temporalmente
  SUSPENDED = 'suspended', // Suspendido por violación
  PENDING = 'pending'     // Pendiente de aprobación
}
```

---

## 8. Troubleshooting

### Error: "Cannot find module"
```bash
# Reconstruir
npm run build
vercel --prod
```

### Error: "Database connection failed"
1. Verificar `DATABASE_URL` en Vercel
2. Asegurar que la IP de Vercel esté whitelistada en Supabase
3. En Supabase: Settings > Database > Connection Pooling (usar puerto 6543)

### Error: "CORS blocked"
Agregar origen a `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://tuapp.vercel.app,https://localhost:4200
```

### Error: "Function timeout"
Vercel tiene límite de 10s en plan gratuito. Optimizar queries o usar plan Pro.

### Ver logs en Vercel
```bash
vercel logs tu-proyecto.vercel.app
```

---

## 📊 Arquitectura Desplegada

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              b2b-webhooks-system                      │  │
│  │                                                       │  │
│  │  /partners/*     → PartnersController                 │  │
│  │  /webhooks/*     → WebhooksController                 │  │
│  │  /events/*       → EventsController                   │  │
│  │  /mcp/*          → McpController (Chatbot)            │  │
│  │  /payments/*     → PaymentController                  │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL                         │  │
│  │              (Supabase / Neon / Railway)              │  │
│  │                                                       │  │
│  │  Tables:                                              │  │
│  │  - b2b_partners (partners registrados)                │  │
│  │  - b2b_events (eventos/webhooks)                      │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Partners Externos:
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Hotel   │  │Restaurant│  │ Parking  │
│  System  │  │   App    │  │   App    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
                   ▼
         HMAC-Authenticated
              Webhooks
```

---

## ✅ Checklist de Despliegue

- [ ] Crear cuenta Vercel
- [ ] Configurar base de datos PostgreSQL (Supabase/Neon)
- [ ] Crear `vercel.json`
- [ ] Actualizar `main.ts` para producción
- [ ] Configurar variables de entorno en Vercel
- [ ] Deploy con `vercel --prod`
- [ ] Verificar endpoint `/partners`
- [ ] Registrar partner de prueba
- [ ] Probar autenticación HMAC
- [ ] Configurar dominio personalizado (opcional)

---

## 🔗 Links Útiles

- [Documentación Vercel](https://vercel.com/docs)
- [NestJS en Vercel](https://vercel.com/guides/using-nestjs-with-vercel)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [HMAC Authentication](https://en.wikipedia.org/wiki/HMAC)

---

**Última actualización:** Enero 2026
