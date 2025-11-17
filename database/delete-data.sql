-- ============================================
-- SCRIPT PARA ELIMINAR TODOS LOS DATOS
-- Ejecutar en orden para respetar foreign keys
-- ============================================

-- Desactivar temporalmente las foreign keys (opcional)
-- SET session_replication_role = 'replica';

-- 1. Eliminar multas (depende de tickets y tipo_multa)
DELETE FROM multa;

-- 2. Eliminar detalles de pago (depende de tickets y pagos)
DELETE FROM detalle_pago;

-- 3. Eliminar pagos
DELETE FROM pago;

-- 4. Eliminar tickets (depende de vehículos y espacios)
DELETE FROM ticket;

-- 5. Eliminar vehículos (depende de clientes y tipo_vehiculo)
DELETE FROM vehiculo;

-- 6. Eliminar clientes
DELETE FROM cliente;

-- 7. Eliminar espacios (depende de secciones)
DELETE FROM espacio;

-- 8. Eliminar secciones
DELETE FROM seccion;

-- 9. Eliminar tipos de multa
DELETE FROM tipo_multa;

-- 10. Eliminar tipos de tarifa (depende de tipo_vehiculo)
DELETE FROM tipo_tarifa;

-- 11. Eliminar tipos de vehículo
DELETE FROM tipo_vehiculo;

-- Reactivar foreign keys (si se desactivaron)
-- SET session_replication_role = 'origin';

-- Resetear secuencias (si existen)
-- ALTER SEQUENCE IF EXISTS seccion_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS espacio_id_seq RESTART WITH 1;
-- etc...

-- Verificar que todas las tablas estén vacías
SELECT 'multa' as tabla, COUNT(*) as registros FROM multa
UNION ALL
SELECT 'detalle_pago', COUNT(*) FROM detalle_pago
UNION ALL
SELECT 'pago', COUNT(*) FROM pago
UNION ALL
SELECT 'ticket', COUNT(*) FROM ticket
UNION ALL
SELECT 'vehiculo', COUNT(*) FROM vehiculo
UNION ALL
SELECT 'cliente', COUNT(*) FROM cliente
UNION ALL
SELECT 'espacio', COUNT(*) FROM espacio
UNION ALL
SELECT 'seccion', COUNT(*) FROM seccion
UNION ALL
SELECT 'tipo_multa', COUNT(*) FROM tipo_multa
UNION ALL
SELECT 'tipo_tarifa', COUNT(*) FROM tipo_tarifa
UNION ALL
SELECT 'tipo_vehiculo', COUNT(*) FROM tipo_vehiculo;

VACUUM ANALYZE;
