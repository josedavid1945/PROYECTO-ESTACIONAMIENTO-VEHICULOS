# 🔐 Auth Service - Microservicio de Autenticación

## Descripción

Microservicio independiente de autenticación para el Sistema de Estacionamiento de Vehículos. Este servicio maneja toda la lógica de autenticación separada del resto de la aplicación, evitando el antipatrón de llamadas constantes al servicio de autenticación.

## Características Principales

### 🔑 JWT con Access y Refresh Tokens
- **Access Token**: Corta duración (15 minutos por defecto)
- **Refresh Token**: Larga duración (7 días por defecto)
- Rotación automática de refresh tokens para mayor seguridad

### ✅ Validación Local
Los demás servicios validan tokens **localmente** verificando firma y expiración, sin consultar al Auth Service en cada petición. Esto mejora significativamente el rendimiento.

### 🗄️ Base de Datos Propia
Tablas independientes para:
- `users` - Usuarios del sistema
- `refresh_tokens` - Tokens de refresco activos
- `revoked_tokens` - Blacklist de tokens revocados

### 🛡️ Seguridad
- Rate limiting en endpoints sensibles (login, register)
- Blacklist de tokens revocados
- Bloqueo automático de cuentas después de intentos fallidos
- Hash de contraseñas con bcrypt (factor 12)

## Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| POST | `/auth/refresh` | Renovar access token | No |
| GET | `/auth/me` | Obtener perfil usuario | Sí |
| GET | `/auth/validate` | Validar token (interno) | No |
| GET | `/auth/validation-secret` | Obtener secreto JWT (interno) | Service Key |
| GET | `/auth/health` | Health check | No |

## Instalación

### Requisitos
- Node.js 20+
- PostgreSQL 15+
- Docker (opcional)

### Desarrollo Local

```bash
# Instalar dependencias
cd auth-service
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar base de datos (con Docker)
docker-compose -f ../docker-compose-local.yml up -d postgres-auth

# Iniciar en modo desarrollo
npm run start:dev
```

### Con Docker

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose-local.yml up -d auth-service
```

## Configuración

Variables de entorno en `.env`:

```env
# Puerto del servicio
PORT=3001

# Base de datos
DATABASE_URL=postgresql://admin:admin123@localhost:5433/auth_db

# JWT
JWT_ACCESS_SECRET=tu-secreto-super-seguro-access
JWT_REFRESH_SECRET=tu-secreto-super-seguro-refresh
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=10

# Clave para servicios internos
INTERNAL_SERVICE_KEY=tu-clave-de-servicio

# Ambiente
NODE_ENV=development
```

## Uso en Otros Servicios

### Validación Local de Tokens

Para evitar llamar al Auth Service en cada request, los otros microservicios deben:

1. **Al iniciar**: Obtener el secreto JWT una vez:

```typescript
import { fetchValidationSecret, JwtLocalValidator } from './shared/jwt-local-validator';

// Al iniciar el servicio
const { secret, algorithm } = await fetchValidationSecret(
  'http://auth-service:3001',
  process.env.INTERNAL_SERVICE_KEY
);

const validator = new JwtLocalValidator({ accessTokenSecret: secret });
```

2. **En cada request**: Validar localmente:

```typescript
// Middleware de validación
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = validator.validateAccessToken(token);
  
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }
  
  req.user = result.payload;
  next();
});
```

### Ejemplo con NestJS

```typescript
// jwt-local.guard.ts
@Injectable()
export class JwtLocalGuard implements CanActivate {
  constructor(private validator: JwtLocalValidator) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    const result = this.validator.validateAccessToken(token);
    if (!result.valid) {
      throw new UnauthorizedException(result.error);
    }
    
    request.user = result.payload;
    return true;
  }
}
```

## Estructura del Proyecto

```
auth-service/
├── src/
│   ├── main.ts                 # Punto de entrada
│   ├── app.module.ts           # Módulo principal
│   ├── modules/
│   │   ├── auth/               # Módulo de autenticación
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/            # DTOs de entrada/salida
│   │   │   ├── guards/         # Guards de autenticación
│   │   │   ├── strategies/     # Estrategias Passport
│   │   │   └── decorators/     # Decoradores personalizados
│   │   ├── users/              # Módulo de usuarios
│   │   │   ├── entities/
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── tokens/             # Módulo de tokens
│   │   │   ├── entities/
│   │   │   ├── tokens.service.ts
│   │   │   └── tokens.module.ts
│   │   └── health/             # Health checks
│   └── shared/
│       └── jwt-local-validator.ts  # Librería para validación local
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@estacionamiento.com | Admin123! | admin |
| operador@estacionamiento.com | Admin123! | operator |
| usuario@ejemplo.com | Admin123! | user |

## API Documentation

Swagger UI disponible en: `http://localhost:3001/api`

## Seguridad

### Rate Limiting
- Register: 5 intentos por minuto
- Login: 10 intentos por minuto
- Refresh: 30 intentos por minuto

### Bloqueo de Cuenta
- Después de 5 intentos fallidos de login
- Duración: 15 minutos

### Tokens Revocados
- Los tokens de logout se agregan a blacklist
- Limpieza automática de tokens expirados

## Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## Licencia

UNLICENSED - Proyecto privado
