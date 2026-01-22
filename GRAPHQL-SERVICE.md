# 📊 GraphQL Service - API de Consultas Optimizada

> **Servicio GraphQL especializado en consultas eficientes y flexibles**  
> Puerto: 8000 | Tecnología: Python + Strawberry GraphQL + FastAPI

---

## 📋 Descripción General

El **GraphQL Service** proporciona una API GraphQL optimizada para consultas complejas y eficientes del sistema de estacionamiento. Implementado en Python con Strawberry GraphQL, ofrece una interfaz flexible que permite a los clientes solicitar exactamente los datos que necesitan, reduciendo el over-fetching y mejorando la performance.

### 🎯 Características Principales

- **GraphQL API** con tipado fuerte
- **Consultas optimizadas** con resolvers eficientes
- **Soporte CORS** configurable
- **Hot reload** para desarrollo
- **Esquemas modulares** organizados por dominio
- **Integración directa** con PostgreSQL

---

## 🏗️ Arquitectura del Servicio

### Estructura Modular
```
graphql-service/
├── app.py                    # 🚀 Aplicación principal
├── schema.py                 # 📋 Esquema GraphQL principal
├── requirements.txt          # 📦 Dependencias Python
├── graphtypes/              # 🎯 Tipos GraphQL
│   ├── cliente_type.py
│   ├── vehiculo_type.py
│   ├── espacios_type.py
│   ├── ticket_type.py
│   ├── detallepago_type.py
│   └── tipoTarifa_type.py
└── services/               # 🔧 Servicios de datos
    ├── cliente_services.py
    ├── vehiculo_services.py
    ├── espacios_services.py
    └── detallepago_services.py
```

### Stack Tecnológico
- **Framework**: Strawberry GraphQL + ASGI
- **Runtime**: Python 3.8+
- **Base de Datos**: PostgreSQL
- **CORS**: Starlette middleware
- **Deploy**: Uvicorn ASGI server

---

## 🎯 Tipos GraphQL Disponibles

### 1. Cliente Type 👤
```python
@strawberry.type
class Cliente:
    id: int
    nombre: str
    email: str
    telefono: str
    fecha_registro: datetime
    vehiculos: List[Vehiculo]
```

### 2. Vehículo Type 🚗
```python
@strawberry.type
class Vehiculo:
    id: int
    placa: str
    marca: str
    modelo: str
    color: str
    cliente_id: int
    cliente: Cliente
```

### 3. Espacios Type 🅿️
```python
@strawberry.type
class Espacio:
    id: int
    numero: str
    tipo: str
    estado: str  # 'libre', 'ocupado', 'reservado'
    tarifa: float
    ubicacion: str
```

### 4. Ticket Type 🎫
```python
@strawberry.type
class Ticket:
    id: int
    fecha_entrada: datetime
    fecha_salida: Optional[datetime]
    vehiculo: Vehiculo
    espacio: Espacio
    total_pagado: float
    estado: str
```

### 5. Detalle Pago Type 💳
```python
@strawberry.type
class DetallePago:
    id: int
    ticket_id: int
    monto: float
    metodo_pago: str
    fecha_pago: datetime
    estado: str
```

---

## 🔍 Consultas GraphQL Principales

### Consultas de Clientes
```graphql
# Obtener todos los clientes con sus vehículos
query GetClientes {
  clientes {
    id
    nombre
    email
    vehiculos {
      placa
      marca
      modelo
    }
  }
}

# Buscar cliente específico
query GetCliente($id: Int!) {
  cliente(id: $id) {
    nombre
    email
    telefono
    vehiculos {
      placa
      tickets {
        fecha_entrada
        fecha_salida
        total_pagado
      }
    }
  }
}
```

### Consultas de Espacios
```graphql
# Estado actual del estacionamiento
query EstadoEstacionamiento {
  espacios {
    numero
    tipo
    estado
    tarifa
    ubicacion
  }
}

# Espacios disponibles
query EspaciosLibres {
  espacios(estado: "libre") {
    numero
    tipo
    tarifa
    ubicacion
  }
}
```

### Consultas de Tickets
```graphql
# Tickets activos (sin salida)
query TicketsActivos {
  tickets(estado: "activo") {
    id
    fecha_entrada
    vehiculo {
      placa
      cliente {
        nombre
      }
    }
    espacio {
      numero
    }
  }
}

# Historial de un vehículo
query HistorialVehiculo($placa: String!) {
  vehiculo(placa: $placa) {
    tickets {
      fecha_entrada
      fecha_salida
      total_pagado
      espacio {
        numero
      }
    }
  }
}
```

### Consultas de Reportes
```graphql
# Reporte de ingresos diarios
query IngresosDelDia($fecha: Date!) {
  pagos(fecha: $fecha) {
    monto
    metodo_pago
    ticket {
      vehiculo {
        placa
      }
    }
  }
}
```

---

## 🔄 Relaciones con Otros Servicios

### 📤 Servicios que CONSUMEN GraphQL Service

1. **Frontend Angular** 🖥️
   - Apollo Client para consultas GraphQL
   - Subscriptions para updates en tiempo real
   - Cache inteligente de datos

2. **B2B Webhooks System** 🤖
   - Consultas complejas para el chatbot
   - Datos para herramientas MCP
   - Análisis y reportes

3. **Backend REST API** 📡
   - Consultas optimizadas inter-servicio
   - Agregación de datos
   - Reportes complejos

### 📥 Servicios que GraphQL Service CONSUME

1. **Base de Datos PostgreSQL** 🗄️
   - Consultas directas optimizadas
   - Joins eficientes
   - Índices para performance

2. **Auth Service** 🔐 (indirectamente)
   - Validación de permisos en resolvers
   - Filtrado de datos por usuario

---

## 🚀 Configuración y Variables de Entorno

```env
# Servidor
HOST=127.0.0.1
PORT=8000
DEBUG=true

# Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/parking_db

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://127.0.0.1:4200

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true
GRAPHQL_INTROSPECTION=true
```

---

## 🎯 Ventajas de GraphQL

### 1. Consultas Precisas 🎯
```graphql
# Solo solicita datos necesarios
query MiniReport {
  clientes {
    nombre              # Solo nombre
    vehiculos {
      placa            # Solo placa
    }
  }
}
```

### 2. Eliminación de Over-fetching 📉
- Reduce transferencia de datos
- Mejora performance de red
- Optimiza uso de recursos

### 3. Agregación de Datos 🔄
```graphql
# Una consulta, múltiples entidades
query Dashboard {
  estadisticas {
    totalEspacios
    espaciosLibres
    ticketsActivos
    ingresosDia
  }
  clientesRecientes(limit: 5) {
    nombre
    fecha_registro
  }
}
```

### 4. Tipado Fuerte 💪
- Validación automática de esquemas
- IntelliSense en desarrollo
- Documentación auto-generada

---

## 📊 Resolvers Optimizados

### Cliente Resolvers
```python
@strawberry.type
class Query:
    @strawberry.field
    def clientes(self) -> List[Cliente]:
        return cliente_service.get_all_clientes()
    
    @strawberry.field
    def cliente(self, id: int) -> Optional[Cliente]:
        return cliente_service.get_cliente_by_id(id)
```

### Resolvers con Filtros
```python
@strawberry.field
def espacios(
    self, 
    estado: Optional[str] = None,
    tipo: Optional[str] = None
) -> List[Espacio]:
    return espacios_service.get_espacios_filtered(estado, tipo)
```

### Resolvers de Agregación
```python
@strawberry.field
def estadisticas_estacionamiento(self) -> EstadisticasType:
    return {
        'total_espacios': espacios_service.count_total(),
        'espacios_libres': espacios_service.count_libres(),
        'tickets_activos': tickets_service.count_activos(),
        'ingresos_hoy': pagos_service.sum_ingresos_hoy()
    }
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar en desarrollo (hot reload)
python app.py

# Ejecutar con Uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Tests
python -m pytest test_service.py

# Validar esquema
strawberry export-schema schema:schema
```

---

## 🎮 GraphQL Playground

### Acceso Local
```
http://localhost:8000/graphql
```

### Características del Playground
- **Explorador de esquemas** interactivo
- **IntelliSense** para consultas
- **Documentación automática** de tipos
- **Historial de consultas**
- **Variables de consulta** dinámicas

---

## 📈 Optimizaciones de Performance

### 1. N+1 Problem Prevention
```python
# Uso de DataLoader para batching
@strawberry.field
def vehiculos(self, root: Cliente) -> List[Vehiculo]:
    return vehiculo_loader.load(root.id)
```

### 2. Database Connections
- **Connection pooling** eficiente
- **Lazy loading** de relaciones
- **Índices optimizados** en PostgreSQL

### 3. Caching Strategies
- **Query result caching**
- **Schema caching**
- **Database query optimization**

---

## 🔍 Monitoreo y Debugging

### Métricas Disponibles
- **Tiempo de respuesta** por resolver
- **Complejidad** de consultas
- **Uso de recursos** de base de datos
- **Rate de errores** por tipo

### Logging
```python
import logging

logger = logging.getLogger(__name__)

@strawberry.field
def clientes(self) -> List[Cliente]:
    logger.info("Ejecutando consulta de clientes")
    start_time = time.time()
    result = cliente_service.get_all_clientes()
    logger.info(f"Consulta completada en {time.time() - start_time}s")
    return result
```

---

## 🚀 Despliegue y Escalabilidad

### Docker Configuration
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Consideraciones de Escalabilidad
- **Horizontal scaling** con load balancers
- **Read replicas** para consultas pesadas
- **Query complexity analysis** para prevención de abuse
- **Rate limiting** por cliente

---

## 🔐 Seguridad

### Validación de Queries
- **Query complexity analysis**
- **Depth limiting** para prevenir queries profundas
- **Rate limiting** por IP/usuario

### Autorización
```python
@strawberry.field
def clientes_privados(self, info) -> List[Cliente]:
    user = get_current_user(info.context)
    if not user.has_permission('view_clients'):
        raise GraphQLError("Unauthorized")
    return cliente_service.get_all_clientes()
```

---

## 📝 Ejemplo de Integración

### Frontend (Angular + Apollo)
```typescript
const GET_PARKING_STATUS = gql`
  query GetParkingStatus {
    espacios {
      numero
      estado
      tipo
    }
    estadisticas {
      espaciosLibres
      totalEspacios
    }
  }
`;

// Uso en componente
const { data, loading } = useQuery(GET_PARKING_STATUS);
```