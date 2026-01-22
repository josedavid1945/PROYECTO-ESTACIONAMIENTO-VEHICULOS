# 🔧 Solución: Flujos de n8n no se activan

## 📋 Problema Identificado

Los flujos de n8n no se activaban cuando se realizaban eventos en la aplicación porque:

1. **Los eventos solo se emitían desde las herramientas MCP** (chatbot), no desde el backend REST cuando se realizaban acciones directamente desde el frontend o la API.

2. **Faltaban variables de entorno** en `docker-compose.yml` para configurar la integración con n8n.

3. **n8n no estaba configurado** en el `docker-compose.yml` principal, solo en `docker-compose-supabase.yml`.

4. **No existía un endpoint interno** para que el backend REST notifique eventos al sistema B2B/n8n.

## ✅ Solución Implementada

### 1. Nuevo Endpoint Interno

Se agregó un endpoint interno en el sistema B2B que permite al backend REST notificar eventos directamente a n8n:

**Endpoint:** `POST /webhooks/internal/event`

**Uso:**
```typescript
// Desde el backend REST, llamar a este endpoint cuando ocurre un evento
await fetch('http://b2b-webhooks:3001/webhooks/internal/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'parking.entered', // o 'parking.exited', 'parking.reserved', etc.
    data: {
      ticketId: '123',
      vehiculoPlaca: 'ABC-123',
      espacioId: '5',
      fechaEntrada: '2024-01-15T10:30:00Z',
      clienteId: '456'
    }
  })
});
```

**Tipos de eventos soportados:**
- `parking.entered` - Vehículo ingresó
- `parking.exited` - Vehículo salió
- `parking.reserved` - Espacio reservado
- `space.updated` - Espacio actualizado
- `payment.completed` - Pago completado
- `payment.failed` - Pago fallido
- `payment.refunded` - Pago reembolsado

### 2. Variables de Entorno Agregadas

Se agregaron las siguientes variables al servicio `b2b-webhooks` en `docker-compose.yml`:

```yaml
environment:
  - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL:-http://parking-n8n:5678}
  - N8N_INTEGRATION_ENABLED=${N8N_INTEGRATION_ENABLED:-true}
```

### 3. Servicio n8n Agregado

Se agregó el servicio n8n al `docker-compose.yml` principal para que esté disponible en todos los entornos.

### 4. Integración con N8nIntegrationService

El `WebhooksController` ahora inyecta y utiliza `N8nIntegrationService` para enviar eventos directamente a n8n.

## 🔌 Cómo Integrar en el Backend REST

Para que los eventos se activen en n8n cuando ocurren en el backend REST, necesitas llamar al endpoint interno desde el backend REST cuando ocurran eventos.

### Ejemplo: Cuando un vehículo entra

En el controlador/service del backend REST donde se registra la entrada:

```typescript
// Después de crear el ticket exitosamente
try {
  await fetch('http://b2b-webhooks:3001/webhooks/internal/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'parking.entered',
      data: {
        ticketId: ticket.id.toString(),
        vehiculoPlaca: ticket.vehiculoPlaca,
        espacioId: ticket.espacioId.toString(),
        fechaEntrada: ticket.fechaEntrada.toISOString(),
        clienteId: ticket.clienteId?.toString(),
      }
    })
  });
} catch (error) {
  // No fallar la operación principal si falla el webhook
  console.error('Error enviando evento a n8n:', error);
}
```

### Ejemplo: Cuando un vehículo sale

En el controlador/service donde se registra la salida:

```typescript
// Después de procesar la salida exitosamente
try {
  await fetch('http://b2b-webhooks:3001/webhooks/internal/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'parking.exited',
      data: {
        ticketId: ticket.id.toString(),
        vehiculoPlaca: ticket.vehiculoPlaca,
        espacioId: ticket.espacioId.toString(),
        fechaSalida: ticket.fechaSalida.toISOString(),
        duracionMinutos: duracionMinutos,
        monto: montoTotal,
        metodoPago: metodoPago
      }
    })
  });
} catch (error) {
  // No fallar la operación principal si falla el webhook
  console.error('Error enviando evento a n8n:', error);
}
```

## 🧪 Pruebas

### 1. Verificar que n8n está corriendo

```bash
curl http://localhost:5678/healthz
```

### 2. Probar el endpoint interno directamente

```bash
curl -X POST http://localhost:3001/webhooks/internal/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "parking.entered",
    "data": {
      "ticketId": "123",
      "vehiculoPlaca": "ABC-123",
      "espacioId": "5",
      "fechaEntrada": "2024-01-15T10:30:00Z"
    }
  }'
```

### 3. Verificar en los logs del servicio b2b-webhooks

```bash
docker logs parking-b2b-webhooks
```

Deberías ver mensajes como:
```
📥 Evento interno recibido: parking.entered
📤 Enviando evento a n8n: parking.entered → /webhook/partner-webhook
✅ Evento parking.entered entregado a n8n (200)
```

### 4. Verificar en los flujos de n8n

Accede a http://localhost:5678 y verifica que los flujos se estén ejecutando cuando se reciben los eventos.

## 🔍 Troubleshooting

### Los eventos no llegan a n8n

1. **Verificar que n8n está corriendo:**
   ```bash
   docker ps | grep parking-n8n
   ```

2. **Verificar la URL de n8n en las variables de entorno:**
   ```bash
   docker exec parking-b2b-webhooks env | grep N8N
   ```

3. **Verificar los logs del servicio b2b-webhooks:**
   ```bash
   docker logs parking-b2b-webhooks | grep -i n8n
   ```

4. **Verificar que el endpoint interno está funcionando:**
   ```bash
   curl -X POST http://localhost:3001/webhooks/internal/event \
     -H "Content-Type: application/json" \
     -d '{"eventType": "parking.entered", "data": {}}'
   ```

### Los flujos de n8n no se activan

1. **Verificar que los webhooks están activos en n8n:**
   - Accede a http://localhost:5678
   - Verifica que los workflows estén activos (toggle ON)
   - Verifica que los webhook nodes estén configurados correctamente

2. **Verificar las rutas de webhook en n8n:**
   - Los webhooks deben estar en las rutas:
     - `/webhook/partner-webhook` para eventos de parking
     - `/webhook/payment-webhook` para eventos de pago
     - `/webhook/mcp-events` para eventos del chatbot

3. **Verificar en los logs de n8n:**
   ```bash
   docker logs parking-n8n
   ```

## 📝 Notas Importantes

1. **No bloquear operaciones principales:** Las llamadas al endpoint interno deben ser asíncronas y no deben bloquear las operaciones principales del backend.

2. **Manejo de errores:** Si el endpoint interno falla, no debe afectar la operación principal. Los errores deben ser registrados pero no propagados.

3. **URL interna:** El endpoint usa la URL interna de Docker (`http://b2b-webhooks:3001`), no `localhost`. Desde dentro de Docker, los servicios se comunican usando los nombres de los contenedores.

4. **Variables de entorno:** Asegúrate de tener las variables de entorno configuradas correctamente en tu archivo `.env` si necesitas personalizar los valores por defecto.

## 🎯 Próximos Pasos

1. Integrar las llamadas al endpoint interno en el backend REST para los eventos de:
   - Entrada de vehículos
   - Salida de vehículos
   - Reservas de espacios
   - Pagos completados/fallidos

2. Considerar agregar un sistema de retry/queue para eventos fallidos

3. Agregar métricas/monitoring para los eventos enviados a n8n
