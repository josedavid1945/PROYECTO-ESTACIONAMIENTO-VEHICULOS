# Frontend de Prueba - Panel de Control

Este es un frontend básico para testear la funcionalidad del WebSocket del sistema de estacionamiento.

## 🚀 Cómo usar

1. **Asegúrate de que el WebSocket server esté corriendo**:
   ```bash
   cd websocket-server
   go run cmd/server/main.go
   ```
   (Debe estar corriendo en http://localhost:8081)

2. **Abre el archivo HTML en tu navegador**:
   - Abre `panel-test.html` directamente en tu navegador
   - O usa la extensión "Live Server" de VS Code

3. **Conectar al WebSocket**:
   - La URL por defecto es `ws://localhost:8081/ws`
   - Presiona el botón "Conectar"

## 📋 Funcionalidades de Prueba

### Botones de Acciones Rápidas:
- **📊 Solicitar Dashboard**: Obtiene estadísticas generales
- **🏢 Espacios por Sección**: Muestra todos los espacios agrupados por sección
- **✅ Espacios Disponibles**: Lista solo espacios libres
- **🎫 Tickets Activos**: Muestra tickets sin salida

### Panel de Dashboard:
Muestra en tiempo real:
- Espacios disponibles/ocupados/total
- Vehículos activos
- Dinero recaudado (hoy y mes)

### Visualización de Espacios:
- **Verde**: Espacio disponible
- **Rojo**: Espacio ocupado (muestra placa del vehículo si está disponible)

### Logs:
- Panel inferior muestra todos los mensajes enviados y recibidos
- Útil para debugging

## 🧪 Cómo Testear

1. **Conectar**: Presiona "Conectar" y verifica que el estado cambie a "✅ Conectado"

2. **Ver datos automáticos**: El servidor envía actualizaciones cada 5 segundos

3. **Solicitar datos manualmente**: Usa los botones de "Acciones Rápidas"

4. **Ver logs**: Revisa el panel de logs para ver todos los mensajes

5. **Probar con datos reales**: 
   - Usa el REST API para crear vehículos, asignar espacios
   - El WebSocket mostrará los cambios en tiempo real

## 📡 Mensajes WebSocket

### Que puedes enviar:
```json
{ "type": "get_dashboard" }
{ "type": "get_espacios_por_seccion" }
{ "type": "get_espacios_disponibles" }
{ "type": "get_tickets_activos" }
```

### Que recibirás:
- `dashboard_update`: Datos generales del dashboard
- `espacios_por_seccion`: Espacios agrupados por sección
- `espacios_disponibles`: Lista de espacios libres
- `tickets_activos`: Tickets sin salida
- `espacio_ocupado`: Evento cuando entra un vehículo
- `espacio_liberado`: Evento cuando sale un vehículo
- `error`: Mensaje de error del servidor

## 🔧 Troubleshooting

**No conecta**:
- Verifica que el servidor WebSocket esté corriendo
- Revisa que el puerto sea el correcto (8081)
- Mira los logs en la consola del navegador (F12)

**No muestra datos**:
- Asegúrate de tener datos en la base de datos
- Presiona los botones de "Acciones Rápidas"
- Revisa los logs en el panel inferior

**CORS errors**:
- El servidor ya tiene CORS habilitado con `*`
- Si aún hay problemas, abre el archivo directamente (file://)
