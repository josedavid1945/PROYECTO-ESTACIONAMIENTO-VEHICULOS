# 🔐 Pilar 1: Microservicio de Autenticación

## Descripción General

Este documento describe la implementación completa del **Microservicio de Autenticación** para el Sistema de Estacionamiento de Vehículos. Este servicio es independiente y se encarga de toda la lógica de autenticación, autorización y gestión de usuarios.

---

## 📋 Índice

1. [Arquitectura](#arquitectura)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [API Endpoints](#api-endpoints)
6. [Seguridad](#seguridad)
7. [Integración con Frontend](#integración-con-frontend)
8. [Roles y Permisos](#roles-y-permisos)
9. [Configuración](#configuración)
10. [Ejecución](#ejecución)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Login   │  │ Register │  │  Guards  │  │   Interceptor    │ │
│  │   Page   │  │   Page   │  │          │  │ (JWT Auto-attach)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼──────────┘
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTH SERVICE (NestJS - Puerto 3001)            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Auth Controller                        │   │
│  │  POST /auth/register  │  POST /auth/login                │   │
│  │  POST /auth/logout    │  POST /auth/refresh              │   │
│  │  GET  /auth/me        │  GET  /auth/validate             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────┐  ┌────────┴────────┐  ┌──────────────────┐   │
│  │ Auth Service │  │ Tokens Service  │  │  Users Service   │   │
│  │ (Business    │  │ (JWT + Refresh) │  │  (CRUD + Roles)  │   │
│  │  Logic)      │  │                 │  │                  │   │
│  └──────────────┘  └─────────────────┘  └──────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                   Guards & Strategies                     │   │
│  │  JwtAuthGuard  │  JwtStrategy  │  ThrottlerGuard         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               PostgreSQL (Supabase)                              │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │   users    │  │  refresh_tokens  │  │  revoked_tokens  │    │
│  │ (Usuarios) │  │ (Sesiones)       │  │  (Blacklist)     │    │
│  └────────────┘  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Backend (auth-service)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | ^11.0.0 | Framework backend |
| TypeORM | ^0.3.x | ORM para PostgreSQL |
| Passport-JWT | ^4.0.1 | Estrategia de autenticación JWT |
| @nestjs/jwt | ^11.0.0 | Gestión de tokens JWT |
| @nestjs/throttler | ^6.4.0 | Rate limiting |
| bcrypt | ^5.1.1 | Hash de contraseñas |
| class-validator | ^0.14.1 | Validación de DTOs |
| @nestjs/swagger | ^8.2.0 | Documentación API |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Angular | 18+ | Framework frontend |
| Signals | - | Estado reactivo |
| HttpClient | - | Peticiones HTTP |
| Guards funcionales | - | Protección de rutas |

---

## 📁 Estructura del Proyecto

### Backend (auth-service/)
```
auth-service/
├── src/
│   ├── main.ts                     # Bootstrap de la aplicación
│   ├── app.module.ts               # Módulo principal
│   │
│   ├── common/                     # Utilidades compartidas
│   │   └── decorators/
│   │       └── current-user.decorator.ts  # Decorador @CurrentUser
│   │
│   └── modules/
│       ├── auth/                   # Módulo de autenticación
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts  # Endpoints de auth
│       │   ├── auth.service.ts     # Lógica de negocio
│       │   ├── dto/
│       │   │   ├── auth.dto.ts           # DTOs de entrada
│       │   │   └── auth-response.dto.ts  # DTOs de respuesta
│       │   └── guards/
│       │       └── jwt-auth.guard.ts
│       │
│       ├── users/                  # Módulo de usuarios
│       │   ├── users.module.ts
│       │   ├── users.service.ts
│       │   └── entities/
│       │       └── user.entity.ts
│       │
│       ├── tokens/                 # Módulo de tokens
│       │   ├── tokens.module.ts
│       │   ├── tokens.service.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── entities/
│       │       ├── refresh-token.entity.ts
│       │       └── revoked-token.entity.ts
│       │
│       └── health/                 # Health checks
│           ├── health.module.ts
│           └── health.controller.ts
│
├── .env                            # Variables de entorno
├── package.json
└── tsconfig.json
```

### Frontend (core/auth/)
```
frontend/Frontend/src/app/
├── core/
│   └── auth/
│       ├── models/
│       │   └── auth.models.ts      # Interfaces y tipos
│       ├── services/
│       │   └── auth.service.ts     # Servicio de autenticación
│       ├── guards/
│       │   └── auth.guards.ts      # Guards de protección
│       └── interceptors/
│           └── auth.interceptor.ts # Interceptor HTTP
│
├── pages/
│   ├── auth/
│   │   ├── login/                  # Página de login
│   │   └── register/               # Página de registro
│   ├── usuario/                    # Páginas de usuario normal
│   │   ├── home/
│   │   └── mis-reservas/
│   └── acceso-denegado/           # Página de acceso denegado
│
├── layouts/
│   └── user-layout/               # Layout para usuarios normales
│
└── app.routes.ts                  # Rutas con guards
```

---

## 🗃️ Base de Datos

### Tablas

#### `users` - Usuarios del sistema
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    document_number VARCHAR(20),
    role users_role_enum DEFAULT 'user',        -- admin, operator, user
    status users_status_enum DEFAULT 'active',  -- active, inactive, locked
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
    locked_until TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `refresh_tokens` - Sesiones activas
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_info VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT false,
    revoked_reason VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `revoked_tokens` - Blacklist de access tokens
```sql
CREATE TABLE revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_jti VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    revoked_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);
```

### Enums
```sql
CREATE TYPE users_role_enum AS ENUM ('admin', 'operator', 'user');
CREATE TYPE users_status_enum AS ENUM ('active', 'inactive', 'locked');
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:3001`
### Documentación Swagger: `http://localhost:3001/api`

### Endpoints Públicos (sin autenticación)

#### `POST /auth/register` - Registro de usuario
```json
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "Password123",
  "firstName": "Juan",
  "lastName": "Pérez"
}

// Response 201
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /auth/login` - Inicio de sesión
```json
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}

// Response 200 (mismo formato que register)
```

#### `POST /auth/logout` - Cerrar sesión
```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "allDevices": false  // opcional: cerrar en todos los dispositivos
}

// Response 200
{
  "message": "Sesión cerrada exitosamente",
  "tokensRevoked": 1
}
```

#### `POST /auth/refresh` - Renovar tokens
```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response 200
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### Endpoints Protegidos (requieren JWT)

#### `GET /auth/me` - Perfil del usuario actual
```json
// Headers: Authorization: Bearer <accessToken>

// Response 200
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "admin",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-20T08:15:00Z"
}
```

#### `GET /auth/validate` - Validar token actual
```json
// Headers: Authorization: Bearer <accessToken>

// Response 200
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "role": "admin"
  }
}
```

### Health Checks

#### `GET /auth/health` - Estado del servicio
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T08:15:00.000Z"
}
```

#### `GET /auth/health/ready` - Readiness check
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-20T08:15:00.000Z"
}
```

---

## 🔒 Seguridad

### Autenticación JWT

| Token | Duración | Propósito |
|-------|----------|-----------|
| Access Token | 15 minutos | Autenticación de requests |
| Refresh Token | 7 días | Renovación de access tokens |

### Estructura del JWT Payload
```json
{
  "sub": "user-uuid",        // ID del usuario
  "email": "user@email.com",
  "role": "admin",           // Rol del usuario
  "type": "access",          // Tipo de token
  "jti": "unique-token-id",  // ID único para blacklist
  "iat": 1642680000,
  "exp": 1642680900
}
```

### Rate Limiting
| Endpoint | Límite | Ventana |
|----------|--------|---------|
| /auth/login | 5 intentos | 60 segundos |
| /auth/register | 3 intentos | 60 segundos |
| /auth/refresh | 30 intentos | 60 segundos |
| Otros endpoints | 100 intentos | 60 segundos |

### Protección contra ataques

1. **Fuerza Bruta**
   - Bloqueo de cuenta después de 5 intentos fallidos
   - Desbloqueo automático después de 30 minutos

2. **Token Blacklist**
   - Access tokens se invalidan al hacer logout
   - Se almacenan en tabla `revoked_tokens`
   - Limpieza automática de tokens expirados

3. **Validación de Contraseñas**
   - Mínimo 8 caracteres
   - Al menos una mayúscula, minúscula y número
   - Hash con bcrypt (10 salt rounds)

4. **CORS**
   - Configurado para aceptar requests del frontend
   - Origins permitidos configurables por ambiente

---

## 🖥️ Integración con Frontend

### AuthService (Angular)
```typescript
// Signals para estado reactivo
const currentUser = signal<UserProfile | null>(null);
const isAuthenticated = signal<boolean>(false);
const isLoading = signal<boolean>(false);

// Computed signals
readonly userRole = computed(() => currentUser()?.role ?? null);
readonly isAdmin = computed(() => currentUser()?.role === 'admin');
readonly fullName = computed(() => {
  const user = currentUser();
  return user ? `${user.firstName} ${user.lastName}` : '';
});
```

### Guards de Rutas
```typescript
// authGuard - Requiere autenticación
// guestGuard - Solo usuarios no autenticados (login, register)
// adminGuard - Solo administradores
// userGuard - Solo usuarios normales
// roleGuard - Roles específicos
```

### Interceptor HTTP
```typescript
// Agrega automáticamente el token JWT a todas las requests
// Excepto: /auth/login, /auth/register, /auth/refresh
// Maneja refresh automático cuando expira el access token
```

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                       FLUJO DE LOGIN                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Usuario ingresa credenciales en /login                      │
│  2. Frontend envía POST /auth/login                              │
│  3. Backend valida credenciales                                  │
│  4. Backend genera tokens (access + refresh)                     │
│  5. Frontend almacena tokens en localStorage                     │
│  6. Frontend redirige según rol:                                 │
│     - admin → /alquiler/dashboard                                │
│     - user → /usuario/home                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE REFRESH TOKEN                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Request falla con 401 Unauthorized                           │
│  2. Interceptor detecta el error                                 │
│  3. Interceptor envía POST /auth/refresh                         │
│  4. Backend valida refresh token                                 │
│  5. Backend genera nuevos tokens                                 │
│  6. Frontend actualiza localStorage                              │
│  7. Interceptor reintenta la request original                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 Roles y Permisos

### Roles Disponibles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Administrador | Dashboard completo, gestión de usuarios |
| `operator` | Operador | Dashboard operativo, gestión de tickets |
| `user` | Usuario | Solo sus reservas y perfil |

### Matriz de Permisos por Ruta

| Ruta | Admin | Operator | User | Guest |
|------|:-----:|:--------:|:----:|:-----:|
| `/login` | ❌ | ❌ | ❌ | ✅ |
| `/register` | ❌ | ❌ | ❌ | ✅ |
| `/alquiler/dashboard` | ✅ | ✅ | ❌ | ❌ |
| `/alquiler/clientes` | ✅ | ✅ | ❌ | ❌ |
| `/alquiler/espacios` | ✅ | ✅ | ❌ | ❌ |
| `/usuario/home` | ❌ | ❌ | ✅ | ❌ |
| `/usuario/mis-reservas` | ❌ | ❌ | ✅ | ❌ |

---

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de Datos
DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.xxxxxxxxxxxx
DB_PASSWORD=your-password
DB_DATABASE=postgres
DB_SSL=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:3000
```

---

## 🚀 Ejecución

### Requisitos Previos
- Node.js >= 18
- npm >= 9
- PostgreSQL (o Supabase)

### Instalación
```bash
# Backend
cd auth-service
npm install
cp .env.example .env
# Configurar variables de entorno
npm run start:dev

# Frontend
cd frontend/Frontend
npm install
npm start
```

### URLs de Desarrollo
| Servicio | URL |
|----------|-----|
| Auth Service | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api |
| Frontend | http://localhost:4200 |

### Comandos Útiles
```bash
# Backend
npm run start:dev       # Desarrollo con hot-reload
npm run build           # Build para producción
npm run test            # Ejecutar tests
npm run lint            # Linting

# Frontend
ng serve                # Servidor de desarrollo
ng build --prod         # Build para producción
ng test                 # Ejecutar tests
```

---

## 📊 Métricas y Monitoreo

### Logs
El servicio utiliza el Logger de NestJS para registrar:
- Registros de usuarios
- Intentos de login (exitosos y fallidos)
- Renovación de tokens
- Logout y revocación de tokens
- Bloqueos de cuenta

### Health Checks
- `GET /auth/health` - Estado básico del servicio
- `GET /auth/health/ready` - Conexión con la base de datos

---

## 🔄 Resumen de Cambios Implementados

1. ✅ Microservicio independiente en NestJS (Puerto 3001)
2. ✅ Autenticación JWT con access y refresh tokens
3. ✅ Rate limiting en endpoints sensibles
4. ✅ Blacklist de tokens revocados
5. ✅ Roles de usuario (admin, operator, user)
6. ✅ Protección contra fuerza bruta
7. ✅ Integración completa con frontend Angular
8. ✅ Guards de rutas basados en roles
9. ✅ Interceptor HTTP para tokens automáticos
10. ✅ Páginas de login, registro y acceso denegado
11. ✅ Layouts diferenciados por rol
12. ✅ Documentación Swagger completa

---

## 📝 Notas Adicionales

### Decisiones de Diseño

1. **Tokens en localStorage vs cookies**: Se eligió localStorage por simplicidad y compatibilidad con SPAs. Para producción, considerar cookies httpOnly.

2. **Refresh Token Rotation**: Cada vez que se usa un refresh token, se genera uno nuevo y se invalida el anterior para mayor seguridad.

3. **Endpoint de logout público**: Se decidió hacer el endpoint de logout público (no requiere JWT válido) para permitir logout incluso con tokens expirados.

4. **Signals vs BehaviorSubject**: Se utilizaron Signals de Angular por ser más modernos y con mejor rendimiento en change detection.

### Mejoras Futuras

- [ ] Autenticación OAuth2 (Google, GitHub)
- [ ] 2FA con TOTP
- [ ] Auditoría completa de acciones
- [ ] Recuperación de contraseña por email
- [ ] Verificación de email
- [ ] Integración con servicio de notificaciones

---

*Documento generado el 17/01/2026*
*Versión: 1.0.0*
