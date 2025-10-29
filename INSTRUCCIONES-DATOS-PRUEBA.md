# 🚀 Guía para Insertar Datos Iniciales

## Opción 1: Ejecutar Script SQL en Supabase (RECOMENDADO)

1. **Accede a Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú izquierdo, haz clic en "SQL Editor"
   - Haz clic en "New Query"

3. **Copia y pega el contenido del archivo**
   ```
   database/seed-data.sql
   ```

4. **Ejecuta el script**
   - Haz clic en "Run" o presiona `Ctrl + Enter`
   - Verás un mensaje de éxito con el conteo de registros

5. **Verifica los datos**
   - Ve a "Table Editor" en el menú izquierdo
   - Revisa las tablas: `seccion`, `espacio`, `tipo_vehiculo`, `tipo_tarifa`, `cliente`, `vehiculo`

---

## Opción 2: Usar el Panel de Administración Web

1. **Abre el panel de administración**
   ```
   frontend/admin-test.html
   ```

2. **Haz clic en "Cargar Datos Iniciales"**
   - Esto creará automáticamente:
     - ✅ 3 Tipos de vehículo (Auto, Moto, Camioneta)
     - ✅ 3 Clientes de prueba
   
3. **Luego puedes crear más datos manualmente:**
   - Vehículos para los clientes
   - Registrar ingresos (tickets)
   - Procesar salidas y pagos

---

## Opción 3: Usar la API REST directamente (Avanzado)

### Crear Tipo de Vehículo
```bash
curl -X POST http://localhost:3000/api/tipo-vehiculo \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Auto","descripcion":"Vehículo liviano"}'
```

### Crear Cliente
```bash
curl -X POST http://localhost:3000/api/cliente \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Pérez","documento":"12345","telefono":"555-1234","email":"juan@test.com"}'
```

### Crear Vehículo
```bash
curl -X POST http://localhost:3000/api/vehicle \
  -H "Content-Type: application/json" \
  -d '{"placa":"ABC-123","marca":"Toyota","modelo":"Corolla","clienteId":"<ID_CLIENTE>","tipoVehiculoId":"<ID_TIPO>"}'
```

---

## 📊 Estructura de Datos Creados

### Secciones (3)
- A (8 espacios)
- B (6 espacios)  
- C (6 espacios)

### Tipos de Vehículo (4)
- Auto - $20/hora
- Moto - $10/hora
- Camioneta - $25/hora
- Bicicleta - $5/hora

### Clientes (5)
- Juan Pérez
- María García
- Carlos Ramírez
- Ana Martínez
- Luis González

### Vehículos (5)
- ABC-123 (Toyota Corolla - Juan)
- XYZ-789 (Honda CBR500 - María)
- DEF-456 (Ford F-150 - Carlos)
- GHI-789 (Nissan Sentra - Ana)
- JKL-012 (Mazda CX-5 - Luis)

---

## 🎯 Pruebas Recomendadas

1. **Registrar Ingreso**
   - Selecciona vehículo: ABC-123
   - Selecciona espacio disponible: A-101
   - Haz clic en "Registrar Ingreso"
   - **Resultado**: Dashboard muestra 1 espacio ocupado, 1 ticket activo

2. **Ver Dashboard Actualizado**
   - Abre `dashboard.html` en otra pestaña
   - Observa cómo se actualiza cada 5 segundos
   - Verás las estadísticas en tiempo real

3. **Registrar Salida**
   - Selecciona el ticket activo
   - Ingresa monto: 45.50
   - Selecciona método: Efectivo
   - Haz clic en "Registrar Salida"
   - **Resultado**: Dashboard muestra dinero recaudado, espacio liberado

4. **Generar Datos Aleatorios**
   - Haz clic en "Generar Datos Aleatorios"
   - Se creará un vehículo con placa aleatoria
   - Úsalo para probar más ingresos

---

## ⚠️ Solución de Problemas

### Error: "No hay tarifas configuradas"
**Solución**: Ejecuta el script SQL `seed-data.sql` en Supabase

### Error: "No hay espacios disponibles"
**Solución**: Verifica que existen espacios con `estado = true` en la tabla `espacio`

### Error: "tipoTarifaId is required"
**Solución**: Asegúrate de que la tabla `tipo_tarifa` tiene registros

### Dashboard no se actualiza
**Solución**: 
1. Verifica que el WebSocket esté corriendo (puerto 8081)
2. Verifica que el REST API esté corriendo (puerto 3000)
3. Abre la consola del navegador (F12) y busca errores

---

## 🔥 Comandos Rápidos

### Iniciar todo el sistema:
```bash
# Terminal 1 - REST API
cd "backend-rest/API - copia/alquiler-rest"
npm run start:dev

# Terminal 2 - WebSocket
cd websocket-server
go run cmd/server/main.go

# Terminal 3 - Abrir dashboards
start frontend/admin-test.html
start frontend/dashboard.html
```

---

✅ **Una vez que tengas los datos iniciales, podrás probar todo el flujo completo del sistema!**
