-- LIMPIEZA COMPLETA Y REINSERCIÓN DE DATOS
-- ADVERTENCIA: Esto borrará TODOS los datos y empezará de cero

-- 1. Eliminar todos los datos en el orden correcto (respetando foreign keys)
DELETE FROM ticket;
DELETE FROM detalle_pago;
DELETE FROM multa;
DELETE FROM vehiculo;
DELETE FROM cliente;
DELETE FROM espacio;
DELETE FROM seccion;
DELETE FROM tipo_vehiculo;
DELETE FROM tipo_tarifa;
DELETE FROM tipo_multa;

-- 2. Reiniciar con datos limpios usando el script actualizado

-- ============================================
-- 1. TARIFAS
-- ============================================
INSERT INTO tipo_tarifa ("tipoTarifa", "precioHora", "precioDia") 
VALUES 
    ('Tarifa Estándar', 20.00, 150.00),
    ('Tarifa Económica', 15.00, 100.00),
    ('Tarifa Premium', 30.00, 200.00),
    ('Tarifa Motocicleta', 10.00, 70.00);

-- ============================================
-- 2. TIPOS DE VEHÍCULO (con tarifa asignada)
-- ============================================
DO $$
DECLARE
    tarifa_estandar_id UUID;
    tarifa_economica_id UUID;
    tarifa_premium_id UUID;
    tarifa_moto_id UUID;
BEGIN
    -- Obtener IDs de tarifas
    SELECT id INTO tarifa_estandar_id FROM tipo_tarifa WHERE "tipoTarifa" = 'Tarifa Estándar';
    SELECT id INTO tarifa_economica_id FROM tipo_tarifa WHERE "tipoTarifa" = 'Tarifa Económica';
    SELECT id INTO tarifa_premium_id FROM tipo_tarifa WHERE "tipoTarifa" = 'Tarifa Premium';
    SELECT id INTO tarifa_moto_id FROM tipo_tarifa WHERE "tipoTarifa" = 'Tarifa Motocicleta';

    -- Insertar tipos de vehículo con tarifas
    INSERT INTO tipo_vehiculo (categoria, descripcion, "tipoTarifaId") VALUES
        ('Auto Compacto', 'Vehículo liviano de 4 ruedas, ideal para ciudad', tarifa_estandar_id),
        ('Motocicleta', 'Motocicleta de 2 ruedas, alta movilidad', tarifa_moto_id),
        ('SUV/Camioneta', 'Vehículo grande tipo SUV o pickup', tarifa_premium_id),
        ('Auto Sedán', 'Vehículo sedán de 4 puertas', tarifa_estandar_id),
        ('Bicicleta', 'Bicicleta de 2 ruedas, eco-friendly', tarifa_economica_id);
END $$;

-- ============================================
-- 3. SECCIONES
-- ============================================
INSERT INTO seccion (letra_seccion) 
VALUES 
    ('A'),
    ('B'),
    ('C');

-- ============================================
-- 4. ESPACIOS (20 espacios distribuidos en 3 secciones)
-- ============================================
DO $$
DECLARE
    seccion_a_id UUID;
    seccion_b_id UUID;
    seccion_c_id UUID;
BEGIN
    -- Obtener IDs de secciones
    SELECT id INTO seccion_a_id FROM seccion WHERE letra_seccion = 'A';
    SELECT id INTO seccion_b_id FROM seccion WHERE letra_seccion = 'B';
    SELECT id INTO seccion_c_id FROM seccion WHERE letra_seccion = 'C';

    -- Espacios Sección A (1-8)
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('A-101', true, seccion_a_id),
        ('A-102', true, seccion_a_id),
        ('A-103', false, seccion_a_id),
        ('A-104', true, seccion_a_id),
        ('A-105', false, seccion_a_id),
        ('A-106', true, seccion_a_id),
        ('A-107', true, seccion_a_id),
        ('A-108', true, seccion_a_id);

    -- Espacios Sección B (1-6)
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('B-201', true, seccion_b_id),
        ('B-202', false, seccion_b_id),
        ('B-203', true, seccion_b_id),
        ('B-204', true, seccion_b_id),
        ('B-205', false, seccion_b_id),
        ('B-206', true, seccion_b_id);

    -- Espacios Sección C (1-6)
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('C-301', true, seccion_c_id),
        ('C-302', true, seccion_c_id),
        ('C-303', false, seccion_c_id),
        ('C-304', true, seccion_c_id),
        ('C-305', true, seccion_c_id),
        ('C-306', true, seccion_c_id);
END $$;

-- ============================================
-- 5. CLIENTES DE PRUEBA
-- ============================================
INSERT INTO cliente (nombre, email, telefono) 
VALUES 
    ('Juan Pérez', 'juan.perez@example.com', '0991234567'),
    ('María García', 'maria.garcia@example.com', '0985678901'),
    ('Carlos Ramírez', 'carlos.ramirez@example.com', '0971112233'),
    ('Ana Martínez', 'ana.martinez@example.com', '0982223344'),
    ('Luis González', 'luis.gonzalez@example.com', '0993334455'),
    ('Sofia López', 'sofia.lopez@example.com', '0984445566'),
    ('Pedro Sánchez', 'pedro.sanchez@example.com', '0975556677');

-- ============================================
-- 6. VEHÍCULOS DE PRUEBA
-- ============================================
DO $$
DECLARE
    juan_id UUID;
    maria_id UUID;
    carlos_id UUID;
    ana_id UUID;
    luis_id UUID;
    sofia_id UUID;
    pedro_id UUID;
    auto_compacto_id UUID;
    moto_id UUID;
    suv_id UUID;
    sedan_id UUID;
BEGIN
    -- Obtener IDs de clientes
    SELECT id INTO juan_id FROM cliente WHERE email = 'juan.perez@example.com';
    SELECT id INTO maria_id FROM cliente WHERE email = 'maria.garcia@example.com';
    SELECT id INTO carlos_id FROM cliente WHERE email = 'carlos.ramirez@example.com';
    SELECT id INTO ana_id FROM cliente WHERE email = 'ana.martinez@example.com';
    SELECT id INTO luis_id FROM cliente WHERE email = 'luis.gonzalez@example.com';
    SELECT id INTO sofia_id FROM cliente WHERE email = 'sofia.lopez@example.com';
    SELECT id INTO pedro_id FROM cliente WHERE email = 'pedro.sanchez@example.com';

    -- Obtener IDs de tipos de vehículo
    SELECT id INTO auto_compacto_id FROM tipo_vehiculo WHERE categoria = 'Auto Compacto';
    SELECT id INTO moto_id FROM tipo_vehiculo WHERE categoria = 'Motocicleta';
    SELECT id INTO suv_id FROM tipo_vehiculo WHERE categoria = 'SUV/Camioneta';
    SELECT id INTO sedan_id FROM tipo_vehiculo WHERE categoria = 'Auto Sedán';

    -- Insertar vehículos
    INSERT INTO vehiculo (placa, marca, modelo, "clienteId", "tipoVehiculoId") VALUES
        ('ABC-123', 'Toyota', 'Corolla', juan_id, auto_compacto_id),
        ('XYZ-789', 'Honda', 'CBR500R', maria_id, moto_id),
        ('DEF-456', 'Ford', 'F-150 Raptor', carlos_id, suv_id),
        ('GHI-789', 'Nissan', 'Sentra', ana_id, sedan_id),
        ('JKL-012', 'Mazda', 'CX-5', luis_id, suv_id),
        ('MNO-345', 'Chevrolet', 'Spark', sofia_id, auto_compacto_id),
        ('PQR-678', 'Yamaha', 'MT-07', pedro_id, moto_id),
        ('STU-901', 'Hyundai', 'Tucson', juan_id, suv_id),
        ('VWX-234', 'Kia', 'Rio', maria_id, auto_compacto_id),
        ('YZA-567', 'Suzuki', 'GSX-R750', carlos_id, moto_id);
END $$;

-- ============================================
-- 7. TIPOS DE MULTA
-- ============================================
INSERT INTO tipo_multa (nombre, monto) 
VALUES 
    ('Exceso de Velocidad en Parqueadero', 50.00),
    ('Estacionamiento en Zona Prohibida', 30.00),
    ('Obstrucción de Entrada/Salida', 75.00),
    ('Falta de Documentación', 25.00),
    ('Daños a Propiedad', 150.00);

-- ============================================
-- 8. DETALLES DE PAGO (para algunos vehículos estacionados)
-- ============================================
INSERT INTO detalle_pago ("pagoTotal", "fechaPago", metodo) 
VALUES 
    (40.00, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'efectivo'),
    (60.00, CURRENT_TIMESTAMP - INTERVAL '3 hours', 'tarjeta'),
    (20.00, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'transferencia'),
    (80.00, CURRENT_TIMESTAMP - INTERVAL '5 hours', 'efectivo');

-- ============================================
-- 9. TICKETS (algunos activos, algunos cerrados)
-- ============================================
DO $$
DECLARE
    espacio_a103_id UUID;
    espacio_a105_id UUID;
    espacio_b202_id UUID;
    espacio_b205_id UUID;
    espacio_c303_id UUID;
    vehiculo_abc123_id UUID;
    vehiculo_xyz789_id UUID;
    vehiculo_def456_id UUID;
    vehiculo_ghi789_id UUID;
    vehiculo_jkl012_id UUID;
    pago1_id UUID;
    pago2_id UUID;
    pago3_id UUID;
    pago4_id UUID;
BEGIN
    -- Obtener IDs de espacios OCUPADOS
    SELECT id INTO espacio_a103_id FROM espacio WHERE numero = 'A-103';
    SELECT id INTO espacio_a105_id FROM espacio WHERE numero = 'A-105';
    SELECT id INTO espacio_b202_id FROM espacio WHERE numero = 'B-202';
    SELECT id INTO espacio_b205_id FROM espacio WHERE numero = 'B-205';
    SELECT id INTO espacio_c303_id FROM espacio WHERE numero = 'C-303';

    -- Obtener IDs de vehículos
    SELECT id INTO vehiculo_abc123_id FROM vehiculo WHERE placa = 'ABC-123';
    SELECT id INTO vehiculo_xyz789_id FROM vehiculo WHERE placa = 'XYZ-789';
    SELECT id INTO vehiculo_def456_id FROM vehiculo WHERE placa = 'DEF-456';
    SELECT id INTO vehiculo_ghi789_id FROM vehiculo WHERE placa = 'GHI-789';
    SELECT id INTO vehiculo_jkl012_id FROM vehiculo WHERE placa = 'JKL-012';

    -- Obtener IDs de pagos
    SELECT id INTO pago1_id FROM detalle_pago WHERE "pagoTotal" = 40.00 LIMIT 1;
    SELECT id INTO pago2_id FROM detalle_pago WHERE "pagoTotal" = 60.00 LIMIT 1;
    SELECT id INTO pago3_id FROM detalle_pago WHERE "pagoTotal" = 20.00 LIMIT 1;
    SELECT id INTO pago4_id FROM detalle_pago WHERE "pagoTotal" = 80.00 LIMIT 1;

    -- Tickets ACTIVOS (sin fecha de salida, espacios ocupados)
    INSERT INTO ticket ("fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", "detallePagoId") VALUES
        (CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, vehiculo_abc123_id, espacio_a103_id, NULL),
        (CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL, vehiculo_xyz789_id, espacio_a105_id, NULL),
        (CURRENT_TIMESTAMP - INTERVAL '3 hours', NULL, vehiculo_def456_id, espacio_b202_id, NULL),
        (CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL, vehiculo_ghi789_id, espacio_b205_id, NULL),
        (CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL, vehiculo_jkl012_id, espacio_c303_id, NULL);

    -- Tickets CERRADOS (con fecha de salida y pago)
    INSERT INTO ticket ("fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", "detallePagoId") VALUES
        (CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '22 hours', vehiculo_abc123_id, espacio_a103_id, pago1_id),
        (CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day 21 hours', vehiculo_xyz789_id, espacio_b202_id, pago2_id),
        (CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days 23 hours', vehiculo_def456_id, espacio_c303_id, pago3_id),
        (CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days 19 hours', vehiculo_ghi789_id, espacio_a105_id, pago4_id);
END $$;

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================
SELECT 'Tarifas' as tabla, COUNT(*) as total FROM tipo_tarifa
UNION ALL
SELECT 'Tipos Vehículo', COUNT(*) FROM tipo_vehiculo
UNION ALL
SELECT 'Secciones', COUNT(*) FROM seccion
UNION ALL
SELECT 'Espacios', COUNT(*) FROM espacio
UNION ALL
SELECT 'Clientes', COUNT(*) FROM cliente
UNION ALL
SELECT 'Vehículos', COUNT(*) FROM vehiculo
UNION ALL
SELECT 'Tipos de Multa', COUNT(*) FROM tipo_multa
UNION ALL
SELECT 'Detalles de Pago', COUNT(*) FROM detalle_pago
UNION ALL
SELECT 'Tickets', COUNT(*) FROM ticket;

-- ============================================
-- RESUMEN DE TICKETS
-- ============================================
SELECT 
    'Tickets Activos' as tipo,
    COUNT(*) as cantidad
FROM ticket 
WHERE "fechaSalida" IS NULL
UNION ALL
SELECT 
    'Tickets Cerrados',
    COUNT(*)
FROM ticket 
WHERE "fechaSalida" IS NOT NULL;

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================
SELECT '✅ Base de datos limpia y datos iniciales cargados correctamente' as mensaje;
