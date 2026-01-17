# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias para OCR y procesamiento
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-spa \
    tesseract-ocr-data-eng \
    python3 \
    make \
    g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Instalar Tesseract para OCR en producción
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-spa \
    tesseract-ocr-data-eng

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar node_modules y build desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Cambiar a usuario no-root
USER nestjs

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost:3001/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
