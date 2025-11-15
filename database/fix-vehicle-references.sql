-- Script para arreglar las referencias de tipo_vehiculo en los vehículos existentes

-- Primero, ver qué tipos de vehículo existen actualmente
SELECT id, categoria, descripcion FROM tipo_vehiculo;

-- Actualizar los vehículos para que referencien tipos de vehículo válidos
-- Esto asignará a cada vehículo el primer tipo de vehículo disponible temporalmente

DO $$
DECLARE
    tipo_valido_id UUID;
BEGIN
    -- Obtener un ID de tipo_vehiculo válido
    SELECT id INTO tipo_valido_id FROM tipo_vehiculo LIMIT 1;
    
    -- Actualizar todos los vehículos que tengan un tipoVehiculoId inválido
    UPDATE vehiculo 
    SET "tipoVehiculoId" = tipo_valido_id
    WHERE "tipoVehiculoId" NOT IN (SELECT id FROM tipo_vehiculo);
    
    RAISE NOTICE 'Vehículos actualizados con tipo válido';
END $$;

-- Verificar que todos los vehículos ahora tienen tipos válidos
SELECT 
    v.placa,
    v.marca,
    v.modelo,
    tv.categoria as tipo_vehiculo,
    tv."tipoTarifaId",
    tt."tipoTarifa" as tarifa
FROM vehiculo v
LEFT JOIN tipo_vehiculo tv ON v."tipoVehiculoId" = tv.id
LEFT JOIN tipo_tarifa tt ON tv."tipoTarifaId" = tt.id
LIMIT 10;
