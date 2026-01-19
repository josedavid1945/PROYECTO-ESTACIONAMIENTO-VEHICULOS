# 🚀 Guía de Ejecución de Servicios

## Sistema de Gestión de Estacionamiento de Vehículos

Este documento contiene las instrucciones para ejecutar cada servicio del proyecto.

---

## 📋 Pre-requisitos

- **Node.js** (v18 o superior)
- **Python** 3.10 o 3.11
- **Go** 1.21+
- **PostgreSQL** 15 (local o en Docker)
- **Docker** (opcional, para la base de datos)

---

## 🗄️ 1. Base de Datos PostgreSQL

### Opción A: Usando Docker (Recomendado)

```bash
# Asegúrate de que Docker Desktop esté ejecutándose

# Desde la raíz del proyecto:
docker-compose -f docker-compose-local.yml up -d
```

### Opción B: PostgreSQL Local

Si tienes PostgreSQL instalado localmente, asegúrate de que esté ejecutándose con las siguientes credenciales:

- **Host**: localhost
- **Puerto**: 5432
- **Usuario**: admin
- **Contraseña**: admin123
- **Base de datos**: estacionamiento

---

## 🔧 2. Backend REST API (NestJS)

### Directorio
```bash
cd backend-rest/API - copia/alquiler-rest
```

### Instalación de dependencias (primera vez)
```bash
npm install
```

### Ejecución
```bash
npm run start:dev
```

### Verificar
- **URL**: http://localhost:3000
- **Swagger**: http://localhost:3000/api

---

## � 3. Auth Service (NestJS)

### Directorio
```bash
cd auth-service
```

### Instalación de dependencias (primera vez)
```bash
npm install
```

### Configuración
Asegúrate de que el archivo `.env` exista con:
```env
PORT=3002
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BACKEND_REST_URL=http://localhost:3000
```

### Ejecución
```bash
npm run start:dev
```

### Verificar
- **URL**: http://localhost:3002
- **Swagger**: http://localhost:3002/api
- **Health**: http://localhost:3002/auth/health

---

## 🔍 4. GraphQL Service (Python/FastAPI)

### Directorio
```bash
cd graphql-service
```

### Instalación de dependencias (primera vez)
```bash
pip install -r requirements.txt
```

### Configuración
Asegúrate de que el archivo `.env` exista con:
```env
API_URL=http://localhost:3000
```

### Ejecución
```bash
# Opción 1: Usando Python 3.10
py -3.10 app.py

# Opción 2: Usando python directamente
python app.py
```

### Verificar
- **URL**: http://127.0.0.1:8000
- **GraphQL Playground**: http://127.0.0.1:8000/graphql

---

## 🔌 5. WebSocket Server (Go)

### Directorio
```bash
cd websocket-server
```

### Instalación de Go (primera vez con Scoop)
```bash
scoop install go
```

### Configuración
El archivo `.env` debe contener:
```env
MODE=rest
REST_API_URL=http://localhost:3000
WS_PORT=8080
WS_PATH=/ws
CORS_ORIGIN=http://localhost:4200
UPDATE_INTERVAL=5
```

### Ejecución
```bash
go run cmd/server/main.go
```

### Verificar
- **WebSocket**: ws://localhost:8080/ws
- El servidor mostrará en consola cuando esté listo

---

## 🌐 6. Frontend (Angular)

### Directorio
```bash
cd frontend/Frontend
```

### Instalación de dependencias (primera vez)
```bash
npm install
```

### Ejecución
```bash
npm start
```

### Verificar
- **URL**: http://localhost:4200

---

## 🤖 7. B2B Webhooks & MCP Chat (NestJS)

### Directorio
```bash
cd b2b-webhooks-system
```

### Instalación de dependencias (primera vez)
```bash
npm install
```

### Configuración
Asegúrate de que el archivo `.env` exista con:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
PARKING_API_URL=http://localhost:3000
GEMINI_API_KEY=tu_api_key_de_google_gemini
GEMINI_API_KEY_BACKUP=tu_api_key_backup
PORT=3001
```

### Ejecución
```bash
npm run start:dev
```

### Verificar
- **URL**: http://localhost:3001
- **Swagger**: http://localhost:3001/api
- **Chat MCP**: POST http://localhost:3001/mcp/chat
- **Health**: http://localhost:3001/health

---

## 🎯 Orden de Ejecución Recomendado

Para ejecutar el proyecto completo, sigue este orden:

1. **Base de Datos PostgreSQL** (Docker o local)
2. **Backend REST API** (NestJS) - Terminal 1
3. **Auth Service** (NestJS) - Terminal 2
4. **GraphQL Service** (Python) - Terminal 3
5. **WebSocket Server** (Go) - Terminal 4
6. **B2B Webhooks Service** (NestJS) - Terminal 5
7. **Frontend** (Angular) - Terminal 6

---

## 📝 Comandos Rápidos (PowerShell)

### Ejecutar Backend REST
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\backend-rest\API - copia\alquiler-rest"
npm run start:dev
```

### Ejecutar Auth Service
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\auth-service"
npm run start:dev
```

### Ejecutar GraphQL Service
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\graphql-service"
py -3.10 app.py
```

### Ejecutar WebSocket Server
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\websocket-server"
go run cmd/server/main.go
```

### Ejecutar B2B Webhooks Service
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\b2b-webhooks-system"
npm run start:dev
```

### Ejecutar Frontend
```powershell
cd "C:\Users\ASUS I5\OneDrive\Desktop\universidad\5to semestre\aplicaciones para servidor web\Estacionamiento de vehiculos\frontend\Frontend"
npm start
```

---

## 🔍 Verificación de Servicios

| Servicio | Puerto | URL de Prueba |
|----------|--------|---------------|
| Backend REST | 3000 | http://localhost:3000/api |
| Auth Service | 3002 | http://localhost:3002/api |
| GraphQL | 8000 | http://127.0.0.1:8000/graphql |
| WebSocket | 8080 | ws://localhost:8080/ws |
| B2B Webhooks | 3001 | http://localhost:3001/api |
| Frontend | 4200 | http://localhost:4200 |
| PostgreSQL | 5432 | localhost:5432 |

---

## ⚠️ Solución de Problemas Comunes

### Python: ModuleNotFoundError
```bash
# Instalar dependencias faltantes
pip install uvicorn strawberry-graphql starlette psycopg2-binary python-dotenv requests
```

### Go: comando 'go' no reconocido
```bash
# Instalar Go con Scoop
scoop install go
```

### PostgreSQL: Error de conexión
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en el archivo de configuración del backend
- Si usas Docker, ejecuta: `docker ps` para verificar el contenedor

### Puerto ya en uso
```bash
# Windows: Encontrar proceso en puerto (ejemplo: 3000)
netstat -ano | findstr :3000

# Terminar proceso por PID
taskkill /PID <número_de_pid> /F
```

---

## 📊 Estado de Ejecución

Cuando todos los servicios estén ejecutándose correctamente, deberías ver:

- ✅ **Backend REST**: Mensajes de log de NestJS
- ✅ **GraphQL**: "Uvicorn running on http://127.0.0.1:8000"
- ✅ **WebSocket**: "✅ Servidor WebSocket escuchando en http://localhost:8080"
- ✅ **Frontend**: "Local: http://localhost:4200/"

---

## 🎓 Integrantes del Proyecto

- Jose David Pacheco Chalen
- Cesar Arteaga Molina
- Stalin Tumbaco

---

**¡Sistema listo para usar!** 🚗🅿️
