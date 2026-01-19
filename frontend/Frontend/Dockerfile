# =====================================================
# FRONTEND ANGULAR - Dockerfile
# =====================================================
# Multi-stage build con Nginx para producción
# =====================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Nginx para servir archivos estáticos
FROM nginx:alpine AS production

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build desde stage anterior (Angular 17+ genera en dist/[project-name]/browser)
COPY --from=builder /app/dist/Frontend/browser /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
