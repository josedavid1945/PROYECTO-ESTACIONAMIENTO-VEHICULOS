# 🚀 GUÍA DE DESPLIEGUE EN RENDER

## 📋 Servicios del Proyecto

| Servicio | Puerto | Tecnología | Descripción |
|----------|--------|------------|-------------|
| **Backend REST** | 3000 | NestJS | API REST principal |
| **Auth Service** | 3001 | NestJS | Autenticación JWT |
| **GraphQL** | 8000 | Python/Strawberry | API GraphQL |
| **WebSocket** | 8080 | Go/Gorilla | Tiempo real |
| **B2B Webhooks** | 3002 | NestJS | Sistema B2B con IA |
| **Frontend** | 80 | Angular/Nginx | Interfaz de usuario |

---

## 🎯 OPCIÓN 1: Despliegue Automático con Blueprint

### Paso 1: Subir código a GitHub
```bash
git add .
git commit -m "Preparar para Render"
git push origin main
```

### Paso 2: Crear Blueprint en Render
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Clic en **"New"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el archivo `render.yaml`
5. Revisa los servicios y clic en **"Apply"**

---

## 🔧 OPCIÓN 2: Despliegue Manual (Servicio por Servicio)

### 1️⃣ Crear Base de Datos PostgreSQL
1. En Render: **New** → **PostgreSQL**
2. Nombre: `parking-database`
3. Plan: Free
4. Guardar las credenciales generadas

### 2️⃣ Backend REST API
1. **New** → **Web Service**
2. Conectar repositorio
3. Configurar:
   - **Name**: `parking-backend-rest`
   - **Root Directory**: `backend-rest/API - copia/alquiler-rest`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
4. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<host-de-postgresql>
   DB_PORT=5432
   DB_USERNAME=<usuario>
   DB_PASSWORD=<password>
   DB_DATABASE=parking_db
   ```

### 3️⃣ Auth Service
1. **New** → **Web Service**
2. Configurar:
   - **Name**: `parking-auth-service`
   - **Root Directory**: `auth-service`
   - **Environment**: Docker
4. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generar-clave-segura>
   JWT_EXPIRES_IN=24h
   DB_HOST=<host-de-postgresql>
   DB_PORT=5432
   DB_USERNAME=<usuario>
   DB_PASSWORD=<password>
   DB_DATABASE=parking_auth
   ```

### 4️⃣ GraphQL Service
1. **New** → **Web Service**
2. Configurar:
   - **Name**: `parking-graphql`
   - **Root Directory**: `graphql-service`
   - **Environment**: Docker
4. Variables de entorno:
   ```
   HOST=0.0.0.0
   PORT=8000
   DEBUG=false
   DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/parking_db
   CORS_ORIGINS=https://parking-frontend.onrender.com
   ```

### 5️⃣ WebSocket Server
1. **New** → **Web Service**
2. Configurar:
   - **Name**: `parking-websocket`
   - **Root Directory**: `websocket-server`
   - **Environment**: Docker
4. Variables de entorno:
   ```
   PORT=8080
   DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/parking_db
   ```

### 6️⃣ B2B Webhooks
1. **New** → **Web Service**
2. Configurar:
   - **Name**: `parking-b2b-webhooks`
   - **Root Directory**: `b2b-webhooks-system`
   - **Environment**: Docker
4. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=3002
   DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/parking_db
   GEMINI_API_KEY=<tu-api-key>
   ```

### 7️⃣ Frontend Angular
1. **New** → **Static Site** o **Web Service**
2. Configurar:
   - **Name**: `parking-frontend`
   - **Root Directory**: `frontend/Frontend`
   - **Environment**: Docker
4. Variables de entorno (en tiempo de build):
   ```
   API_URL=https://parking-backend-rest.onrender.com
   GRAPHQL_URL=https://parking-graphql.onrender.com/graphql
   WS_URL=wss://parking-websocket.onrender.com/ws
   ```

---

## 🐳 OPCIÓN 3: Docker Compose Local/VPS

### Construir y ejecutar todo:
```bash
# Copiar variables de entorno
cp .env.production .env

# Editar .env con tus valores
nano .env

# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Comandos útiles:
```bash
# Ver estado de servicios
docker-compose -f docker-compose.prod.yml ps

# Reiniciar un servicio
docker-compose -f docker-compose.prod.yml restart backend-rest

# Detener todo
docker-compose -f docker-compose.prod.yml down

# Eliminar todo incluyendo volúmenes
docker-compose -f docker-compose.prod.yml down -v
```

---

## 📝 URLs de Producción (Render)

Una vez desplegado, tus servicios estarán en:

| Servicio | URL |
|----------|-----|
| Frontend | https://parking-frontend.onrender.com |
| Backend REST | https://parking-backend-rest.onrender.com |
| Auth Service | https://parking-auth-service.onrender.com |
| GraphQL | https://parking-graphql.onrender.com/graphql |
| WebSocket | wss://parking-websocket.onrender.com/ws |
| B2B Webhooks | https://parking-b2b-webhooks.onrender.com |

---

## ⚠️ Notas Importantes

1. **Plan Free de Render**: Los servicios se duermen después de 15 min de inactividad
2. **Base de datos**: En plan free expira después de 90 días
3. **Variables secretas**: Nunca subas `.env` a Git
4. **CORS**: Actualiza las URLs en producción
5. **Frontend**: Actualiza `environment.prod.ts` con las URLs reales

---

## 🔐 Generar JWT Secret

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🆘 Troubleshooting

### Error de conexión a BD:
- Verifica que la IP del servicio esté en whitelist
- Confirma credenciales en variables de entorno

### Build fallido:
- Revisa los logs de build en Render
- Verifica que el Dockerfile esté correcto

### CORS errors:
- Agrega el dominio del frontend a CORS_ORIGINS
