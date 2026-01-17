-- =====================================================
-- AUTH SERVICE - Script de Inicialización de Base de Datos
-- =====================================================
-- Este script crea las tablas necesarias para el microservicio
-- de autenticación independiente.
-- =====================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users
-- Almacena información de usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    phone VARCHAR(20),
    document_number VARCHAR(20),
    last_login TIMESTAMP,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_role CHECK (role IN ('admin', 'operator', 'user')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =====================================================
-- TABLA: refresh_tokens
-- Almacena refresh tokens activos de los usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- =====================================================
-- TABLA: revoked_tokens (Blacklist)
-- Almacena tokens revocados antes de su expiración
-- =====================================================
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti VARCHAR(255) NOT NULL UNIQUE,
    token_type VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_token_type CHECK (token_type IN ('access', 'refresh'))
);

-- Índices para revoked_tokens
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON revoked_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token_type ON revoked_tokens(token_type);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Limpiar tokens expirados (ejecutar periódicamente)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TABLE(
    deleted_refresh_tokens INTEGER,
    deleted_revoked_tokens INTEGER
) AS $$
DECLARE
    refresh_count INTEGER;
    revoked_count INTEGER;
BEGIN
    -- Eliminar refresh tokens expirados
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS refresh_count = ROW_COUNT;
    
    -- Eliminar registros de blacklist expirados
    DELETE FROM revoked_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    RETURN QUERY SELECT refresh_count, revoked_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES: Usuario administrador por defecto
-- Password: Admin123! (hasheado con bcrypt)
-- =====================================================
INSERT INTO users (id, email, password, first_name, last_name, role, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@estacionamiento.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.mMJ.nGTu', -- Admin123!
    'Administrador',
    'Sistema',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Usuario operador de ejemplo
INSERT INTO users (id, email, password, first_name, last_name, role, status)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'operador@estacionamiento.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.mMJ.nGTu', -- Admin123!
    'Operador',
    'Principal',
    'operator',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Usuario normal de ejemplo
INSERT INTO users (id, email, password, first_name, last_name, role, status, phone, document_number)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'usuario@ejemplo.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.mMJ.nGTu', -- Admin123!
    'Juan',
    'Pérez',
    'user',
    'active',
    '+51999888777',
    '12345678'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE users IS 'Usuarios del sistema de estacionamiento';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresco activos para mantener sesiones';
COMMENT ON TABLE revoked_tokens IS 'Blacklist de tokens revocados antes de expirar';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin, operator, user';
COMMENT ON COLUMN users.status IS 'Estado de la cuenta: active, inactive, suspended';
COMMENT ON COLUMN users.failed_login_attempts IS 'Contador de intentos de login fallidos para bloqueo temporal';
COMMENT ON COLUMN users.locked_until IS 'Fecha hasta la cual la cuenta está bloqueada';
COMMENT ON COLUMN refresh_tokens.jti IS 'JWT ID único del token original';
COMMENT ON COLUMN revoked_tokens.jti IS 'JWT ID del token revocado para validación rápida';

COMMIT;
