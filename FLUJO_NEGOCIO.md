# 🚗 FLUJO DE NEGOCIO - Sistema de Estacionamiento

> Documentación del flujo de operaciones del sistema de gestión de estacionamiento.

---

## 📋 Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Roles de Usuario](#roles-de-usuario)
3. [Flujo del Administrador/Operador](#flujo-del-administradoroperador)
4. [Flujo del Usuario Final](#flujo-del-usuario-final)
5. [Cálculo Automático de Tarifas](#cálculo-automático-de-tarifas)
6. [Endpoints Disponibles](#endpoints-disponibles)
7. [Diagrama de Flujo](#diagrama-de-flujo)

---

## 🏢 Resumen del Sistema

El sistema de estacionamiento permite gestionar:
- **Espacios de estacionamiento** organizados por secciones
- **Clientes y sus vehículos**
- **Tickets de entrada/salida** con cálculo automático de tarifas
- **Portal de usuario** para que clientes consulten sus registros

### Microservicios Involucrados

| Servicio | Puerto | Función |
|----------|--------|---------|
| Backend REST | 3000 | API principal de operaciones |
| Auth Service | 3002 | Autenticación y gestión de usuarios |
| GraphQL | 8000 | Consultas flexibles de datos |
| WebSocket | 8080 | Notificaciones en tiempo real |
| Frontend | 4200 | Interfaz de usuario Angular |

---

## 👥 Roles de Usuario

### 🔐 Administrador/Operador
- Registra nuevos clientes y vehículos
- Asigna espacios de estacionamiento
- Registra salidas y cobra pagos
- Gestiona multas
- Configura tarifas y espacios

### 👤 Usuario Final (Cliente)
- Se registra en el auth-service
- Vincula su cuenta con su información de cliente existente
- Consulta sus tickets activos (vehículos estacionados)
- Ve historial de estacionamientos
- Consulta resumen de gastos
- **NO puede hacer reservas ni registrar vehículos**

---

## 🔧 Flujo del Administrador/Operador

### FLUJO 1: Registro de Cliente con Vehículo

```
POST /registro/cliente-vehiculo-completo
```

**Proceso:**
1. Recibe datos del cliente y vehículo
2. ✅ **Valida que la placa no esté duplicada**
3. ✅ **Busca si ya existe un cliente con ese email**
   - Si existe: usa el cliente existente
   - Si no existe: crea nuevo cliente
4. Crea el vehículo vinculado al cliente
5. ✅ **Todo se ejecuta en una transacción**
   - Si algo falla, se hace rollback completo

**Request:**
```json
{
  "clienteNombre": "Juan",
  "clienteApellido": "Pérez",
  "clienteEmail": "juan@email.com",
  "clienteTelefono": "1234567890",
  "vehiculoPlaca": "ABC-123",
  "vehiculoMarca": "Toyota",
  "vehiculoModelo": "Corolla",
  "vehiculoColor": "Blanco",
  "tipoVehiculoId": "uuid-tipo-vehiculo"
}
```

**Response exitoso:**
```json
{
  "message": "Cliente y vehículo registrados exitosamente",
  "cliente": { "id": "...", "nombre": "Juan", ... },
  "vehiculo": { "id": "...", "placa": "ABC-123", ... }
}
```

---

### FLUJO 2: Asignar Espacio (Entrada de Vehículo)

```
POST /registro/asignar-espacio
```

**Proceso:**
1. Valida que el espacio esté disponible
2. Valida que el vehículo exista
3. ✅ **Crea el ticket con fecha de ingreso**
4. ✅ **Marca el espacio como ocupado**
5. ✅ **Todo se ejecuta en una transacción**

**Request:**
```json
{
  "espacioId": "uuid-espacio",
  "vehiculoId": "uuid-vehiculo"
}
```

**Response:**
```json
{
  "message": "Espacio asignado exitosamente",
  "ticket": {
    "id": "uuid-ticket",
    "fechaIngreso": "2024-01-15T10:30:00.000Z",
    "vehiculoId": "...",
    "espacioId": "..."
  },
  "espacio": { "numero": "A-01", "estado": false }
}
```

---

### FLUJO 3: Desocupar Espacio (Salida de Vehículo)

```
POST /registro/desocupar-espacio
```

**Proceso:**
1. Busca el ticket activo
2. Obtiene la tarifa del tipo de vehículo
3. ✅ **Calcula automáticamente el tiempo y monto:**
   - Si tiempo ≥ 8 horas: cobra por día
   - Si tiempo < 8 horas: cobra por hora (mínimo 1 hora)
4. Registra fecha de salida en el ticket
5. Crea el detalle de pago
6. Libera el espacio (estado = true)
7. ✅ **Todo se ejecuta en una transacción**

**Request:**
```json
{
  "ticketId": "uuid-ticket",
  "metodoPago": "Efectivo"
  // montoPago y tipoTarifaId son OPCIONALES
  // Se calculan automáticamente si no se envían
}
```

**Response:**
```json
{
  "message": "Espacio desocupado y pago registrado exitosamente",
  "ticket": {
    "id": "...",
    "fechaIngreso": "2024-01-15T10:30:00.000Z",
    "fechaSalida": "2024-01-15T14:45:00.000Z",
    "horasEstacionamiento": 4.25,
    "montoCalculado": 20.00
  },
  "pago": {
    "monto": 20.00,
    "metodoPago": "Efectivo"
  },
  "espacio": { "numero": "A-01", "estado": true },
  "resumenCalculo": {
    "horasEstacionamiento": 4.25,
    "horasCobradas": 5,
    "tarifaPorHora": 4.00,
    "montoCalculado": 20.00,
    "tipoTarifa": "Automóvil"
  }
}
```

---

## 👤 Flujo del Usuario Final

### Paso 1: Registro en Auth-Service

El usuario se registra en el microservicio de autenticación:

```
POST http://localhost:3002/auth/register
```

```json
{
  "email": "juan@email.com",
  "password": "MiPassword123!",
  "username": "juanperez"
}
```

---

### Paso 2: Vincular Cuenta con Cliente

Una vez autenticado, el usuario vincula su cuenta con su información de cliente:

```
POST /user-portal/vincular
Headers: x-auth-user-id: {uuid-del-auth-service}
```

```json
{
  "email": "juan@email.com"
}
```

**¿Qué sucede?**
1. El sistema busca un cliente con ese email
2. Si lo encuentra y no está vinculado, vincula la cuenta
3. Retorna los vehículos asociados al cliente

**Response:**
```json
{
  "mensaje": "¡Cuenta vinculada exitosamente!",
  "cliente": {
    "id": "...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com"
  },
  "vehiculos": [
    {
      "placa": "ABC-123",
      "marca": "Toyota",
      "modelo": "Corolla"
    }
  ]
}
```

---

### Paso 3: Consultar Información

#### Ver Perfil
```
GET /user-portal/perfil
Headers: x-auth-user-id: {uuid}
```

#### Ver Tickets Activos
```
GET /user-portal/tickets-activos
Headers: x-auth-user-id: {uuid}
```

Muestra vehículos actualmente estacionados con tiempo transcurrido.

#### Ver Historial
```
GET /user-portal/historial?limit=20
Headers: x-auth-user-id: {uuid}
```

Muestra tickets pasados con montos pagados.

#### Ver Resumen de Gastos
```
GET /user-portal/resumen-gastos
Headers: x-auth-user-id: {uuid}
```

Estadísticas: total visitas, gasto total, tiempo total.

---

## 💰 Cálculo Automático de Tarifas

El sistema calcula automáticamente el monto a pagar basado en:

### Reglas de Cálculo

| Condición | Fórmula |
|-----------|---------|
| Tiempo < 8 horas | `ceil(horas) × precioHora` |
| Tiempo ≥ 8 horas | `ceil(horas/24) × precioDía` |

### Ejemplos

| Tiempo | Tipo | Tarifa Hora | Tarifa Día | Monto |
|--------|------|-------------|------------|-------|
| 2h 30m | Auto | $4.00 | $25.00 | $12.00 (3h × $4) |
| 45m | Moto | $2.00 | $12.00 | $2.00 (1h mínimo) |
| 10h | Auto | $4.00 | $25.00 | $25.00 (1 día) |
| 26h | Camión | $6.00 | $35.00 | $70.00 (2 días) |

---

## 🔗 Endpoints Disponibles

### Operaciones (Administrador)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/registro/cliente-vehiculo-completo` | Registrar cliente con vehículo |
| POST | `/registro/asignar-espacio` | Asignar espacio a vehículo |
| POST | `/registro/desocupar-espacio` | Liberar espacio y cobrar |
| GET | `/registro/espacios-disponibles` | Ver espacios libres |
| GET | `/registro/vehiculos-ocupados` | Ver vehículos estacionados |
| GET | `/registro/clientes-vehiculos` | Ver todos los clientes |
| GET | `/registro/buscar-cliente/:email` | Buscar cliente por email |
| GET | `/registro/buscar-vehiculo/:placa` | Buscar vehículo por placa |

### Portal de Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/user-portal/vincular` | Vincular cuenta con cliente |
| GET | `/user-portal/perfil` | Ver mi perfil |
| GET | `/user-portal/tickets-activos` | Ver mis vehículos estacionados |
| GET | `/user-portal/historial` | Ver historial de tickets |
| GET | `/user-portal/resumen-gastos` | Ver estadísticas de gastos |

---

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMINISTRADOR/OPERADOR                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   REGISTRO    │         │    ENTRADA    │         │    SALIDA     │
│   Cliente +   │         │   Vehículo    │         │   Vehículo    │
│   Vehículo    │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ ✓ Validar     │         │ ✓ Verificar   │         │ ✓ Calcular    │
│   placa única │         │   espacio     │         │   tiempo      │
│ ✓ Buscar      │         │   disponible  │         │ ✓ Calcular    │
│   cliente     │         │ ✓ Crear       │         │   monto       │
│   existente   │         │   ticket      │         │ ✓ Registrar   │
│ ✓ Crear en    │         │ ✓ Ocupar      │         │   pago        │
│   transacción │         │   espacio     │         │ ✓ Liberar     │
└───────────────┘         └───────────────┘         │   espacio     │
                                                    └───────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          USUARIO FINAL                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  REGISTRO EN  │         │   VINCULAR    │         │   CONSULTAR   │
│  AUTH-SERVICE │ ──────▶ │    CUENTA     │ ──────▶ │  INFORMACIÓN  │
│               │         │  (con email)  │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
                                                            │
                          ┌─────────────────────────────────┤
                          ▼                 ▼               ▼
                   ┌──────────┐      ┌──────────┐    ┌──────────┐
                   │ Tickets  │      │Historial │    │ Resumen  │
                   │ Activos  │      │ Pasado   │    │ Gastos   │
                   └──────────┘      └──────────┘    └──────────┘
```

---

## 🔒 Seguridad Implementada

1. **Variables de entorno** para credenciales de BD
2. **Validación de origen** en WebSocket
3. **CORS configurado** por entorno
4. **Transacciones de BD** para consistencia
5. **Validación de datos** con class-validator
6. **JWT tokens** para autenticación

---

## ⚡ Mejoras Implementadas

| Problema Original | Solución |
|-------------------|----------|
| Credenciales hardcodeadas | Movidas a variables de entorno |
| Sin cálculo automático de pago | Implementado basado en tarifa y tiempo |
| Sin validación de placa duplicada | Validación con error descriptivo |
| Sin transacciones de BD | QueryRunner con commit/rollback |
| Multa sin vincular a ticket | Agregados campos ticketId, vehiculoId |
| Cliente creado siempre nuevo | Búsqueda por email primero |
| Sin portal de usuario | Endpoints completos para consultas |

---

## 📝 Notas Adicionales

- El **mínimo cobrable** es 1 hora
- Tarifas configuradas por **tipo de vehículo**
- El usuario **NO puede** hacer reservas, solo consultar
- El admin debe registrar al cliente **antes** de que pueda vincularse
- Todas las operaciones críticas usan **transacciones**

---

*Documentación generada automáticamente - Sistema de Estacionamiento v2.0*
