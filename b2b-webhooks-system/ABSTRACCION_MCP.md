# Abstracción y Servicios MCP

## ¿Hay abstracción alta?
Sí, el módulo MCP en este proyecto implementa una **abstracción alta**. Esto se logra mediante:
- **Interfaces y contratos**: Se define la interfaz `McpTool` para estandarizar cómo se describe y ejecuta cada herramienta (servicio).
- **Inyección de dependencias**: Los servicios usan el patrón de inyección de dependencias de NestJS para desacoplar la lógica de negocio de la infraestructura.
- **Registro dinámico de herramientas**: Las herramientas MCP se registran dinámicamente en el `McpToolsService`, permitiendo agregar o modificar funcionalidades sin alterar el controlador ni la orquestación general.
- **Separación de responsabilidades**: Cada servicio (`BusinessToolsService`, `ParkingToolsService`) implementa un conjunto de herramientas específicas, manteniendo el código modular y fácil de mantener.

## ¿Cómo se implementa la abstracción?
- **`McpTool`**: Es una interfaz que define el contrato para cualquier herramienta MCP (nombre, descripción, parámetros, handler, roles, etc).
- **`McpToolsService`**: Es el registro central y ejecutor de herramientas. Permite registrar, listar y ejecutar herramientas de forma uniforme.
- **Servicios especializados**: Cada servicio (por ejemplo, `BusinessToolsService`, `ParkingToolsService`) implementa y registra sus propias herramientas usando el contrato común.
- **Controlador único**: El `McpController` expone un endpoint genérico para ejecutar cualquier herramienta registrada, desacoplando la API de la lógica interna.

## Estructura del Proyecto (Módulo MCP)

```
b2b-webhooks-system/
  src/
    mcp/
      mcp.controller.ts         # API REST para herramientas MCP
      mcp.module.ts             # Módulo NestJS, importa y provee servicios MCP
      mcp-tools.service.ts      # Registro y ejecución de herramientas MCP
      business-tools.service.ts # Herramientas de negocio (tickets, pagos, partners)
      parking-tools.service.ts  # Herramientas de parking (clientes, espacios, reportes)
```

## Descripción de cada servicio

### 1. McpToolsService
- **Rol:** Registro y ejecución de todas las herramientas MCP.
- **Responsabilidad:**
  - Registrar herramientas con nombre, descripción, parámetros y handler.
  - Listar herramientas disponibles según el rol del usuario.
  - Ejecutar el handler de la herramienta solicitada.
- **Abstracción:** Permite que cualquier servicio registre herramientas siguiendo el contrato `McpTool`.

### 2. BusinessToolsService
- **Rol:** Implementa herramientas de negocio generales.
- **Responsabilidad:**
  - Registrar herramientas como ver ticket, procesar pago, registrar partner, simular eventos, etc.
  - Usar otros servicios (partners, eventos, pagos) para implementar la lógica de cada herramienta.
- **Ejemplos de herramientas:**
  - `ver_ticket`: Consultar ticket por ID o placa.
  - `procesar_pago`: Procesar un pago de ticket.
  - `registrar_partner`: Registrar un nuevo partner B2B.

### 3. ParkingToolsService
- **Rol:** Herramientas especializadas en gestión de estacionamiento.
- **Responsabilidad:**
  - Registrar herramientas como buscar cliente, ver tickets históricos, registrar ingreso/salida, reportes diarios.
  - Integrarse con la API de parking para obtener datos en tiempo real.
- **Ejemplos de herramientas:**
  - `buscar_cliente`: Buscar cliente por email, nombre o placa.
  - `buscar_espacios`: Buscar espacios disponibles por zona.
  - `resumen_recaudacion`: Reporte de ingresos diarios.

---

Esta arquitectura permite agregar nuevas herramientas MCP fácilmente, manteniendo el código desacoplado, reutilizable y escalable.