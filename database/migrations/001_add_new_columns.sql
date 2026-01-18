-- =====================================================
-- MIGRACIÓN: Agregar columnas para nuevas funcionalidades
-- Fecha: 2026-01-17
-- Descripción: Agrega columnas necesarias para:
--   1. Vinculación de usuarios con clientes (Portal de Usuario)
--   2. Cálculo automático de pagos en tickets
--   3. Vinculación de multas con tickets y vehículos
-- =====================================================

-- =====================================================
-- 1. TABLA CLIENTE - Vinculación con Auth Service
-- =====================================================

-- Agregar columna para vincular con el auth-service
ALTER TABLE public.cliente 
ADD COLUMN IF NOT EXISTS auth_user_id uuid NULL;

-- Agregar columna para fecha de vinculación
ALTER TABLE public.cliente 
ADD COLUMN IF NOT EXISTS linked_at timestamp without time zone NULL;

-- Crear índice para búsquedas por auth_user_id
CREATE INDEX IF NOT EXISTS idx_cliente_auth_user_id 
ON public.cliente(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN public.cliente.auth_user_id IS 'ID del usuario en el Auth Service para vincular cuenta';
COMMENT ON COLUMN public.cliente.linked_at IS 'Fecha y hora en que el usuario vinculó su cuenta';


-- =====================================================
-- 2. TABLA TICKET - Campos para cálculo automático
-- =====================================================

-- Agregar columna para monto calculado automáticamente
ALTER TABLE public.ticket 
ADD COLUMN IF NOT EXISTS monto_calculado double precision NULL;

-- Agregar columna para horas de estacionamiento
ALTER TABLE public.ticket 
ADD COLUMN IF NOT EXISTS horas_estacionamiento double precision NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.ticket.monto_calculado IS 'Monto calculado automáticamente basado en tarifa y tiempo';
COMMENT ON COLUMN public.ticket.horas_estacionamiento IS 'Horas totales de estacionamiento (calculado al salir)';


-- =====================================================
-- 3. TABLA MULTA - Vinculación con ticket y vehículo
-- =====================================================

-- Agregar columna para vincular con ticket
ALTER TABLE public.multa 
ADD COLUMN IF NOT EXISTS "ticketId" uuid NULL;

-- Agregar columna para vincular con vehículo
ALTER TABLE public.multa 
ADD COLUMN IF NOT EXISTS "vehiculoId" uuid NULL;

-- Agregar columna para fecha de multa
ALTER TABLE public.multa 
ADD COLUMN IF NOT EXISTS fecha_multa timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Agregar columna para estado de multa
ALTER TABLE public.multa 
ADD COLUMN IF NOT EXISTS estado character varying DEFAULT 'pendiente';

-- Crear foreign keys (solo si no existen)
DO $$
BEGIN
    -- FK para ticket
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_multa_ticket' AND table_name = 'multa'
    ) THEN
        ALTER TABLE public.multa 
        ADD CONSTRAINT fk_multa_ticket 
        FOREIGN KEY ("ticketId") REFERENCES public.ticket(id) ON DELETE SET NULL;
    END IF;
    
    -- FK para vehiculo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_multa_vehiculo' AND table_name = 'multa'
    ) THEN
        ALTER TABLE public.multa 
        ADD CONSTRAINT fk_multa_vehiculo 
        FOREIGN KEY ("vehiculoId") REFERENCES public.vehiculo(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_multa_ticket_id ON public.multa("ticketId");
CREATE INDEX IF NOT EXISTS idx_multa_vehiculo_id ON public.multa("vehiculoId");
CREATE INDEX IF NOT EXISTS idx_multa_estado ON public.multa(estado);

-- Comentarios descriptivos
COMMENT ON COLUMN public.multa."ticketId" IS 'Ticket asociado a la multa (opcional)';
COMMENT ON COLUMN public.multa."vehiculoId" IS 'Vehículo al que se le aplica la multa';
COMMENT ON COLUMN public.multa.fecha_multa IS 'Fecha y hora en que se generó la multa';
COMMENT ON COLUMN public.multa.estado IS 'Estado de la multa: pendiente, pagada, anulada';


-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas fueron agregadas correctamente
DO $$
BEGIN
    -- Verificar cliente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cliente' AND column_name = 'auth_user_id') THEN
        RAISE EXCEPTION 'Columna auth_user_id no fue creada en cliente';
    END IF;
    
    -- Verificar ticket
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ticket' AND column_name = 'monto_calculado') THEN
        RAISE EXCEPTION 'Columna monto_calculado no fue creada en ticket';
    END IF;
    
    -- Verificar multa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'multa' AND column_name = 'vehiculoId') THEN
        RAISE EXCEPTION 'Columna vehiculoId no fue creada en multa';
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente ✓';
END $$;
