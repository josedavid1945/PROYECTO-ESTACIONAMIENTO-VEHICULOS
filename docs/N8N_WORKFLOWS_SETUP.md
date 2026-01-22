# 📋 Configuración de Workflows de n8n

## 🔄 Workflows Implementados

Este proyecto incluye 3 workflows principales de n8n (según el Pilar 4):

### 1. Partner Handler ✅
**Archivo:** `n8n-workflows/partner-handler-complete.json`

**Ruta del Webhook:** `/webhook/partner-webhook`

**Función:** 
- Recibe webhooks de partners externos o eventos internos del sistema
- Verifica firma HMAC
- Procesa según tipo de evento (parking.entered, parking.exited, parking.reserved)
- Ejecuta acción de negocio
- Responde ACK

**Tipos de eventos que procesa:**
- `parking.entered` - Vehículo ingresó
- `parking.exited` - Vehículo salió
- `parking.reserved` - Espacio reservado
- `space.updated` - Espacio actualizado

**Configuración:**
- ✅ Acepta eventos internos del sistema (`internal-system`)
- ✅ Validación HMAC relajada para eventos internos
- ✅ Procesa eventos tanto de partners externos como del sistema interno

---

### 2. MCP Input Handler ✅
**Archivo:** `n8n-workflows/mcp-input-handler-v3.json`

**Ruta del Webhook:** `/webhook/mcp-chat`

**Función:**
- Recibe mensajes de Telegram/Email
- Extrae contenido y adjuntos
- Envía a AI Orchestrator (B2B Service)
- Responde por el mismo canal

**Canaales soportados:**
- Telegram
- Email
- API directa

**Integración:**
- Se conecta con `http://parking-b2b:3001/mcp/chat` para procesar mensajes

---

### 3. Scheduled Tasks ✅
**Archivo:** `n8n-workflows/scheduled-tasks.json`

**Función:**
- Ejecuta tareas programadas automáticamente

**Tareas incluidas:**
1. **Reporte Diario** - 8:00 AM (Cron: `0 8 * * *`)
   - Obtiene dashboard del sistema
   - Genera reporte diario con resumen de operaciones
   
2. **Health Check** - Cada 5 minutos (Cron: `*/5 * * * *`)
   - Verifica estado de todos los servicios
   - Registra logs de salud
   
3. **Limpieza de Datos** - 2:00 AM (Cron: `0 2 * * *`)
   - Limpia datos antiguos si es necesario
   
4. **Recordatorios** - Cada 4 horas (Cron: `0 */4 * * *`)
   - Envía recordatorios programados

---

## 🔧 Cómo Importar los Workflows en n8n

### Paso 1: Acceder a n8n
1. Abre tu navegador y ve a `http://localhost:5678`
2. Inicia sesión con las credenciales:
   - Usuario: `admin`
   - Contraseña: (la configurada en `N8N_PASSWORD` o por defecto `parking2026`)

### Paso 2: Importar Workflows

#### Partner Handler
1. Haz clic en **"Workflows"** en el menú lateral
2. Haz clic en **"Import"** (botón superior derecho)
3. Selecciona el archivo `n8n-workflows/partner-handler-complete.json`
4. El workflow se importará con el nombre "Partner Handler COMPLETO - Parking B2B"
5. **Activa el workflow** (toggle en la parte superior derecha)

#### MCP Input Handler
1. Repite los pasos 1-2 anteriores
2. Selecciona el archivo `n8n-workflows/mcp-input-handler-v3.json`
3. El workflow se importará con el nombre "MCP Input Handler v3"
4. **Activa el workflow**

#### Scheduled Tasks
1. Repite los pasos 1-2 anteriores
2. Selecciona el archivo `n8n-workflows/scheduled-tasks.json`
3. El workflow se importará con el nombre "Scheduled Tasks - Parking System"
4. **Activa el workflow** (se ejecutará automáticamente según los cron configurados)

### Paso 3: Verificar Webhooks

Después de importar y activar los workflows, verifica que los webhooks estén activos:

1. Haz clic en el nodo **"Webhook"** de cada workflow
2. Copia la URL del webhook (aparece en la configuración del nodo)
3. Verifica que las rutas sean:
   - Partner Handler: `http://localhost:5678/webhook/partner-webhook`
   - MCP Input Handler: `http://localhost:5678/webhook/mcp-chat`

**Nota:** Las URLs internas (dentro de Docker) son diferentes:
   - Partner Handler: `http://parking-n8n:5678/webhook/partner-webhook`
   - MCP Input Handler: `http://parking-n8n:5678/webhook/mcp-chat`

---

## ✅ Verificación de Funcionamiento

### 1. Verificar que los Workflows están Activos

En n8n, todos los workflows deben tener el **toggle activo** (verde) en la parte superior derecha.

### 2. Probar Partner Handler

Puedes probar el Partner Handler con un evento simulado:

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

Luego verifica en n8n:
1. Ve a **"Executions"** en el menú lateral
2. Deberías ver una ejecución reciente del workflow "Partner Handler COMPLETO"
3. Haz clic para ver los detalles de la ejecución

### 3. Verificar Scheduled Tasks

1. Espera 5 minutos para que se ejecute el Health Check
2. Ve a **"Executions"** en n8n
3. Deberías ver ejecuciones del workflow "Scheduled Tasks - Parking System"

### 4. Verificar Logs

Revisa los logs del servicio b2b-webhooks para ver si los eventos se están enviando:

```bash
docker logs parking-b2b-webhooks | grep -i n8n
```

Deberías ver mensajes como:
```
📤 Enviando evento a n8n: parking.entered → /webhook/partner-webhook
✅ Evento parking.entered entregado a n8n (200)
```

---

## 🔍 Troubleshooting

### Los workflows no se activan

1. **Verificar que n8n está corriendo:**
   ```bash
   docker ps | grep parking-n8n
   ```

2. **Verificar que los workflows están activos:**
   - En n8n, asegúrate de que el toggle esté verde (activado)
   - Los workflows deben aparecer con un círculo verde si están activos

3. **Verificar las rutas de webhook:**
   - El Partner Handler debe estar en `/webhook/partner-webhook`
   - El MCP Input Handler debe estar en `/webhook/mcp-chat`

### Error: "Unauthorized partner"

Si ves este error, significa que el workflow está rechazando el evento porque el `x-api-key` no está en la lista de partners autorizados.

**Solución:** El workflow ya está actualizado para aceptar `internal-system` como partner autorizado. Si aún ves el error:

1. Verifica que importaste la versión actualizada del workflow (`partner-handler-complete.json`)
2. Revisa el código del nodo "2. Verificar HMAC" y asegúrate de que incluya `'internal-system'` en `AUTHORIZED_PARTNERS`

### Los eventos no llegan a los workflows

1. **Verificar que el endpoint interno está funcionando:**
   ```bash
   curl -X POST http://localhost:3001/webhooks/internal/event \
     -H "Content-Type: application/json" \
     -d '{"eventType": "parking.entered", "data": {}}'
   ```

2. **Verificar la URL de n8n:**
   ```bash
   docker exec parking-b2b-webhooks env | grep N8N
   ```
   Debe mostrar: `N8N_WEBHOOK_URL=http://parking-n8n:5678`

3. **Verificar conectividad entre servicios:**
   ```bash
   docker exec parking-b2b-webhooks ping -c 1 parking-n8n
   ```

---

## 📝 Notas Importantes

1. **Workflows deben estar activos:** Los workflows solo se ejecutan si el toggle está activado (verde) en n8n.

2. **Scheduled Tasks:** El workflow de tareas programadas se ejecuta automáticamente, pero solo si está activo.

3. **Eventos internos vs externos:** 
   - Los eventos internos usan `internal-system` como `x-api-key` y `internal-signature` como firma
   - Los eventos de partners externos deben tener un API key válido y firma HMAC correcta

4. **URLs internas:** Dentro de Docker, usa los nombres de contenedores (`parking-n8n`, `parking-b2b-webhooks`). Desde fuera de Docker, usa `localhost`.

5. **Reiniciar workflows:** Si actualizas un workflow, necesitas desactivarlo y reactivarlo para que tome los cambios.

---

## 🎯 Próximos Pasos

1. **Integrar en el backend REST:** Agregar llamadas al endpoint `/webhooks/internal/event` cuando ocurren eventos de parking
2. **Configurar partners externos:** Si tienes partners externos, registrar sus API keys en el sistema B2B
3. **Monitorear ejecuciones:** Revisar regularmente las ejecuciones en n8n para detectar errores
4. **Personalizar workflows:** Ajustar los workflows según las necesidades específicas del negocio
