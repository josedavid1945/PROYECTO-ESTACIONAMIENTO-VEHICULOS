# 🚗 Guía de Pruebas - Sistema de Estacionamiento

Esta guía te ayudará a probar el flujo completo del sistema de estacionamiento con todos sus servicios.

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Inicio de Servicios](#inicio-de-servicios)
4. [Flujo de Pruebas](#flujo-de-pruebas)
5. [Pruebas del Dashboard en Tiempo Real](#pruebas-del-dashboard-en-tiempo-real)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js** (v18 o superior)
- ✅ **Angular CLI** (v20.3.7)
- ✅ **NestJS CLI** (v10+)
- ✅ **Python** (v3.9+)
- ✅ **Go** (v1.21+)
- ✅ **PostgreSQL** (v14+)
- ✅ **Docker** (opcional, para ejecutar con docker-compose)

---

## ⚙️ Configuración Inicial

### 1. Base de Datos PostgreSQL

**Crear la base de datos:**
```sql
CREATE DATABASE estacionamiento_db;
```

**Ejecutar scripts en orden:**
```bash
# 1. Estructura inicial
psql -U postgres -d estacionamiento_db -f database/init.sql

# 2. Datos de prueba
psql -U postgres -d estacionamiento_db -f database/seed-data.sql
```

**Verificar datos cargados:**
```sql
-- Conectarse a la base de datos
psql -U postgres -d estacionamiento_db

-- Verificar datos
SELECT * FROM secciones;
SELECT * FROM espacios LIMIT 10;
SELECT * FROM tarifas;
SELECT * FROM clientes_diarios;
```

### 2. Variables de Entorno

**Backend REST (NestJS):**
```bash
cd backend-rest/API\ -\ copia/alquiler-rest
```

Crear archivo `.env`:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=tu_password
DATABASE_NAME=estacionamiento_db

# Server
PORT=3000
NODE_ENV=development
```

**GraphQL Service (Python):**
```bash
cd graphql-service
```

Crear archivo `.env`:
```env
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/estacionamiento_db
PORT=8000
```

**WebSocket Server (Go):**
```bash
cd websocket-server
```

Crear archivo `.env` o exportar variables:
```env
# Modo de operación: "database" o "rest"
MODE=database

# PostgreSQL (si MODE=database)
DATABASE_URL=postgres://postgres:tu_password@localhost:5432/estacionamiento_db?sslmode=disable

# REST API (si MODE=rest)
REST_API_URL=http://localhost:3000/api

# WebSocket
WS_PORT=8080
WS_PATH=/ws
UPDATE_INTERVAL=5
CORS_ORIGIN=http://localhost:4200
```

---

## 🚀 Inicio de Servicios

### Opción 1: Docker Compose (Recomendado)

**Iniciar todos los servicios:**
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

**Verificar que todos estén corriendo:**
```bash
docker-compose ps
```

### Opción 2: Manual (Desarrollo)

#### 1. Backend REST (NestJS) - Puerto 3000

```bash
cd backend-rest/API\ -\ copia/alquiler-rest

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run start:dev
```

**Verificar:** http://localhost:3000/api
- Deberías ver la documentación Swagger

#### 2. GraphQL Service (Python) - Puerto 8000

```bash
cd graphql-service

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app:app --reload --port 8000
```

**Verificar:** http://localhost:8000/graphql
- Deberías ver GraphiQL playground

#### 3. WebSocket Server (Go) - Puerto 8080

```bash
cd websocket-server

# Instalar dependencias
go mod download

# Iniciar servidor
go run cmd/server/main.go
```

**Verificar:** http://localhost:8080
- Deberías ver la página de bienvenida del WebSocket server
- Health check: http://localhost:8080/health

#### 4. Frontend (Angular) - Puerto 4200

```bash
cd frontend/Frontend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
ng serve -o
```

**Verificar:** http://localhost:4200
- La aplicación se abrirá automáticamente en el navegador

---

## 🧪 Flujo de Pruebas

### 1. Dashboard en Tiempo Real (Página de Inicio)

**URL:** http://localhost:4200

**Qué verificar:**
- ✅ Indicador de conexión WebSocket (punto verde pulsante)
- ✅ **Espacios Disponibles**: Debe mostrar número > 0
- ✅ **Espacios Ocupados**: Número de espacios con vehículos
- ✅ **Total de Espacios**: Suma de disponibles + ocupados
- ✅ **Dinero Recaudado Hoy**: Monto en COP del día actual
- ✅ **Dinero Recaudado Mes**: Monto en COP del mes actual
- ✅ **Vehículos Activos**: Cantidad de tickets activos
- ✅ **Porcentaje de Ocupación**: Se calcula automáticamente

**Nota:** Los datos se actualizan cada 5 segundos automáticamente.

---

### 2. Gestión de Espacios

**URL:** http://localhost:4200/estacionamiento/vista-secciones

#### Paso 1: Crear una Sección Nueva
1. Click en **"Nueva Sección"**
2. Ingresar letra de la sección (ej: "D")
3. Click en **"Crear Sección"**

**Resultado esperado:**
- ✅ Nueva pestaña con la letra "D" aparece
- ✅ La sección se muestra vacía (sin espacios)

#### Paso 2: Crear Espacios en la Sección
1. Seleccionar la sección creada
2. Click en **"Crear Espacios"**
3. Ingresar cantidad (ej: 10)
4. Click en **"Crear Espacios"**

**Resultado esperado:**
- ✅ Se crean 10 espacios numerados (D1, D2, ..., D10)
- ✅ Todos los espacios están **Disponibles** (toggle verde)
- ✅ Las estadísticas se actualizan:
  - Total de Espacios: +10
  - Disponibles: +10

#### Paso 3: Cambiar Estado de un Espacio
1. Usar el toggle para marcar un espacio como **No Disponible**

**Resultado esperado:**
- ✅ El badge cambia de "Disponible" (azul) a "Ocupado" (gris)
- ✅ Las estadísticas se actualizan automáticamente
- ✅ El **Dashboard** se actualiza en tiempo real (verifica en otra pestaña)

#### Paso 4: Eliminar un Espacio
1. Click en **"Eliminar"** en un espacio
2. Confirmar la acción

**Resultado esperado:**
- ✅ El espacio desaparece de la tabla
- ✅ Las estadísticas se actualizan

---

### 3. Registro de Clientes

**URL:** http://localhost:4200/estacionamiento/registro

#### Opción 1: Nuevo Cliente

**Paso 1: Acceder al formulario**
1. Click en card **"Nuevo Cliente"**

**Paso 2: Llenar formulario de cliente**
```
Nombre: Juan Pérez
Teléfono: 3001234567
Email: juan@example.com (opcional)
```

**Paso 3: Llenar datos del vehículo**
```
Placa: ABC123
Marca: Toyota
Modelo: Corolla
Color: Blanco
Tipo de Vehículo: Seleccionar de la lista (ej: Auto)
```

**Paso 4: Registrar**
- Click en **"Registrar Cliente y Vehículo"**

**Resultado esperado:**
- ✅ Mensaje de éxito
- ✅ Cliente creado en la base de datos
- ✅ Vehículo asociado al cliente
- ✅ Se puede proceder a asignar espacio

---

#### Opción 2: Asignar Espacio

**Paso 1: Buscar vehículo**
1. Click en card **"Asignar Espacio"**
2. Ingresar placa del vehículo (ej: ABC123)
3. Click en **"Buscar"**

**Resultado esperado:**
- ✅ Tabla muestra datos del vehículo encontrado
- ✅ Botón **"Seleccionar"** habilitado

**Paso 2: Seleccionar espacio**
1. Click en **"Seleccionar"** en el vehículo
2. En la segunda tabla, buscar un espacio disponible
3. Click en la fila del espacio (toda la fila es clickeable)

**Resultado esperado:**
- ✅ Radio button se marca automáticamente
- ✅ Botón **"Asignar Espacio"** se habilita

**Paso 3: Confirmar asignación**
1. Click en **"Asignar Espacio"**

**Resultado esperado:**
- ✅ Mensaje de éxito
- ✅ Se crea un **ticket** con hora de ingreso
- ✅ El espacio cambia a **Ocupado**
- ✅ El **Dashboard** muestra:
  - Espacios Disponibles: -1
  - Espacios Ocupados: +1
  - Vehículos Activos: +1
- ✅ **WebSocket emite evento** "espacio_ocupado"

---

#### Opción 3: Desocupar Espacio

**Paso 1: Buscar vehículo activo**
1. Click en card **"Desocupar Espacio"**
2. Ingresar placa del vehículo (ej: ABC123)
3. Click en **"Buscar Vehículo"**

**Resultado esperado:**
- ✅ Tabla muestra:
  - Datos del vehículo
  - Espacio ocupado (ej: A5)
  - Hora de ingreso
  - Tarifa aplicable
  - **Tiempo transcurrido** (actualización en tiempo real)

**Paso 2: Ver cálculo de tarifa**
- El sistema calcula automáticamente según:
  - Tipo de vehículo
  - Tiempo transcurrido (minutos)
  - Tarifa configurada

**Paso 3: Desocupar**
1. Click en **"Desocupar Espacio"**

**Resultado esperado:**
- ✅ Mensaje de éxito con monto a pagar
- ✅ Se cierra el **ticket** (hora_salida registrada)
- ✅ Se calcula el **monto total**
- ✅ Se crea registro de **pago**
- ✅ El espacio queda **Disponible** nuevamente
- ✅ El **Dashboard** se actualiza:
  - Espacios Disponibles: +1
  - Espacios Ocupados: -1
  - Vehículos Activos: -1
  - Dinero Recaudado Hoy: +monto
- ✅ **WebSocket emite evento** "espacio_liberado"

---

### 4. Búsqueda de Vehículos

**URL:** http://localhost:4200/estacionamiento/busqueda

#### Búsqueda por Placa
1. Ingresar placa (ej: ABC123)
2. Click en **"Buscar"**

**Resultado esperado:**
- ✅ Muestra información del vehículo
- ✅ Datos del propietario (cliente diario)
- ✅ Historial de tickets
- ✅ Estado actual (si está en el estacionamiento)

---

### 5. Herramientas de Configuración

**URL:** http://localhost:4200/estacionamiento/herramientas

#### A. Gestión de Tarifas

**Crear nueva tarifa:**
1. Click en card **"Gestión de Tarifas"**
2. Click en **"Nueva Tarifa"**
3. Llenar datos:
```
Descripción: Tarifa Moto Hora
Precio por Minuto: 50
Tipo de Vehículo: Moto
```
4. Click en **"Crear Tarifa"**

**Resultado esperado:**
- ✅ Tarifa aparece en la tabla
- ✅ Se puede editar o eliminar

#### B. Gestión de Multas

**Crear nueva multa:**
1. Click en card **"Gestión de Multas"**
2. Click en **"Nueva Multa"**
3. Llenar datos:
```
Descripción: Estacionamiento indebido
Monto: 50000
```
4. Click en **"Crear Multa"**

**Resultado esperado:**
- ✅ Multa aparece en la lista
- ✅ Se puede aplicar a tickets

#### C. Tipos de Vehículos

**Crear nuevo tipo:**
1. Click en card **"Tipos de Vehículos"**
2. Click en **"Nuevo Tipo"**
3. Llenar datos:
```
Nombre: Bicicleta
Descripción: Vehículo no motorizado
```
4. Click en **"Crear Tipo"**

**Resultado esperado:**
- ✅ Aparece en la lista de tipos
- ✅ Está disponible al registrar vehículos

---

## 📊 Pruebas del Dashboard en Tiempo Real

### Test de Actualización Automática

**Configuración de prueba:**
1. Abrir **dos pestañas** del navegador
2. Pestaña 1: Dashboard (http://localhost:4200)
3. Pestaña 2: Registro (http://localhost:4200/estacionamiento/registro)

**Procedimiento:**
1. En Pestaña 2, asignar un espacio a un vehículo
2. Observar Pestaña 1 (Dashboard)

**Resultado esperado:**
- ✅ El Dashboard se actualiza **automáticamente** sin refrescar
- ✅ Los números cambian en tiempo real:
  - Espacios Disponibles: -1
  - Espacios Ocupados: +1
  - Vehículos Activos: +1
- ✅ Puedes ver un mensaje en consola: "🚗 Espacio ocupado: {...}"

**Repetir desocupando un espacio:**
1. En Pestaña 2, desocupar un espacio
2. Observar Pestaña 1

**Resultado esperado:**
- ✅ Dashboard se actualiza automáticamente
- ✅ Dinero Recaudado Hoy aumenta
- ✅ Espacios vuelven a cambiar

---

### Test de Reconexión WebSocket

**Procedimiento:**
1. Con la aplicación corriendo, detener el servidor WebSocket:
```bash
# En la terminal del servidor Go, presionar Ctrl+C
```

2. Observar el Dashboard

**Resultado esperado:**
- ✅ El indicador cambia a **"Reconectando..."** (ámbar)
- ✅ Después de 5 intentos, muestra **"Desconectado"** (rojo)
- ✅ Aparece botón **"Reintentar"**

3. Reiniciar el servidor WebSocket:
```bash
go run cmd/server/main.go
```

4. Click en **"Reintentar"** en el Dashboard

**Resultado esperado:**
- ✅ El indicador cambia a **"Conectado en tiempo real"** (verde pulsante)
- ✅ Los datos se cargan automáticamente

---

## 🐛 Solución de Problemas

### Problema: Backend no inicia

**Error:** `Cannot connect to database`

**Solución:**
1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe:
```bash
psql -U postgres -l | grep estacionamiento
```

---

### Problema: WebSocket no conecta

**Error:** `WebSocket connection failed`

**Solución:**
1. Verificar que el servidor Go esté corriendo:
```bash
curl http://localhost:8080/health
```

2. Verificar configuración CORS en el servidor
3. Verificar puerto en `websocket.service.ts` (debe ser 8080)

---

### Problema: Frontend muestra errores

**Error:** `Module not found` o `Cannot find module`

**Solución:**
```bash
cd frontend/Frontend
rm -rf node_modules package-lock.json
npm install
ng serve
```

---

### Problema: Datos no se actualizan en el Dashboard

**Posibles causas:**
1. WebSocket no conectado (verificar indicador)
2. Servidor WebSocket en modo incorrecto

**Solución:**
1. Verificar logs del servidor Go
2. Cambiar `MODE=database` en `.env` del servidor Go
3. Reiniciar servidor WebSocket

---

## 📱 Endpoints de API para Pruebas Manuales

### REST API (Backend NestJS)

**Base URL:** http://localhost:3000/api

```bash
# Ver todas las secciones
curl http://localhost:3000/api/parking/secciones

# Ver espacios disponibles
curl http://localhost:3000/api/parking/espacios/disponibles

# Ver tarifas
curl http://localhost:3000/api/tarifas

# Ver clientes
curl http://localhost:3000/api/clients
```

### GraphQL API

**URL:** http://localhost:8000/graphql

**Ejemplo de query:**
```graphql
query {
  espacios {
    id
    numero
    estado
    seccion {
      letraSeccion
    }
  }
}
```

### WebSocket API

**URL:** ws://localhost:8080/ws

**Conectar con wscat:**
```bash
npm install -g wscat
wscat -c ws://localhost:8080/ws

# Solicitar datos del dashboard
{"type":"get_dashboard"}

# Solicitar espacios por sección
{"type":"get_espacios_por_seccion"}
```

---

## 🎯 Checklist de Pruebas Completas

Usa este checklist para verificar que todo funciona:

### Servicios
- [ ] PostgreSQL corriendo
- [ ] Backend REST (NestJS) en puerto 3000
- [ ] GraphQL Service (Python) en puerto 8000
- [ ] WebSocket Server (Go) en puerto 8080
- [ ] Frontend (Angular) en puerto 4200

### Dashboard
- [ ] WebSocket conectado (indicador verde)
- [ ] Espacios disponibles muestra número correcto
- [ ] Espacios ocupados muestra número correcto
- [ ] Dinero recaudado visible
- [ ] Vehículos activos correcto
- [ ] Actualización automática funciona

### Gestión de Espacios
- [ ] Crear sección
- [ ] Crear espacios en sección
- [ ] Cambiar estado de espacio (toggle)
- [ ] Eliminar espacio
- [ ] Estadísticas se actualizan

### Registro
- [ ] Crear nuevo cliente con vehículo
- [ ] Buscar vehículo existente
- [ ] Asignar espacio a vehículo
- [ ] Desocupar espacio
- [ ] Cálculo de tarifa correcto
- [ ] Pago registrado

### Búsqueda
- [ ] Buscar por placa
- [ ] Ver información de vehículo
- [ ] Ver historial de tickets

### Herramientas
- [ ] Crear/editar/eliminar tarifas
- [ ] Crear/editar/eliminar multas
- [ ] Crear/editar/eliminar tipos de vehículos

### Tiempo Real
- [ ] Dashboard actualiza al asignar espacio
- [ ] Dashboard actualiza al desocupar espacio
- [ ] Reconexión automática funciona
- [ ] Eventos se registran en consola

---

## 📚 Recursos Adicionales

- **Documentación API REST:** http://localhost:3000/api (Swagger)
- **GraphQL Playground:** http://localhost:8000/graphql
- **WebSocket Info:** http://localhost:8080
- **Logs del sistema:** Cada terminal muestra logs en tiempo real

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs en cada terminal
2. Verifica que todos los servicios estén corriendo
3. Revisa la sección de [Solución de Problemas](#solución-de-problemas)
4. Verifica que los datos de prueba estén cargados en la BD

---

**¡Listo para probar! 🚀**

El sistema completo está diseñado para gestionar un estacionamiento de vehículos con actualización en tiempo real mediante WebSocket, APIs REST y GraphQL, todo con una interfaz moderna en Angular.
