
-- 1. SECCIONES
-- ============================================
INSERT INTO seccion (letra_seccion) 
VALUES 
    ('A'),
    ('B'),
    ('C')
ON CONFLICT (letra_seccion) DO NOTHING;

-- ============================================
-- 2. ESPACIOS (20 espacios distribuidos en 3 secciones)
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
        ('A-103', true, seccion_a_id),
        ('A-104', true, seccion_a_id),
        ('A-105', true, seccion_a_id),
        ('A-106', true, seccion_a_id),
        ('A-107', true, seccion_a_id),
        ('A-108', true, seccion_a_id)
    ON CONFLICT (numero) DO NOTHING;

    -- Espacios Sección B (1-6)
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('B-201', true, seccion_b_id),
        ('B-202', true, seccion_b_id),
        ('B-203', true, seccion_b_id),
        ('B-204', true, seccion_b_id),
        ('B-205', true, seccion_b_id),
        ('B-206', true, seccion_b_id)
    ON CONFLICT (numero) DO NOTHING;

    -- Espacios Sección C (1-6)
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('C-301', true, seccion_c_id),
        ('C-302', true, seccion_c_id),
        ('C-303', true, seccion_c_id),
        ('C-304', true, seccion_c_id),
        ('C-305', true, seccion_c_id),
        ('C-306', true, seccion_c_id)
    ON CONFLICT (numero) DO NOTHING;
END $$;

-- ============================================
-- 3. TIPOS DE VEHÍCULO
-- ============================================
INSERT INTO tipo_vehiculo (nombre, descripcion) 
VALUES 
    ('Auto', 'Vehículo liviano de 4 ruedas'),
    ('Moto', 'Motocicleta de 2 ruedas'),
    ('Camioneta', 'Camioneta pickup o SUV'),
    ('Bicicleta', 'Bicicleta de 2 ruedas')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. TARIFAS (basadas en tipo de vehículo)
-- ============================================
DO $$
DECLARE
    auto_id UUID;
    moto_id UUID;
    camioneta_id UUID;
    bici_id UUID;
BEGIN
    -- Obtener IDs de tipos de vehículo
    SELECT id INTO auto_id FROM tipo_vehiculo WHERE nombre = 'Auto';
    SELECT id INTO moto_id FROM tipo_vehiculo WHERE nombre = 'Moto';
    SELECT id INTO camioneta_id FROM tipo_vehiculo WHERE nombre = 'Camioneta';
    SELECT id INTO bici_id FROM tipo_vehiculo WHERE nombre = 'Bicicleta';

    -- Insertar tarifas por hora
    INSERT INTO tipo_tarifa (nombre, precio_hora, "tipoVehiculoId") VALUES
        ('Auto - Hora', 20.00, auto_id),
        ('Moto - Hora', 10.00, moto_id),
        ('Camioneta - Hora', 25.00, camioneta_id),
        ('Bicicleta - Hora', 5.00, bici_id);
END $$;

-- ============================================
-- 5. CLIENTES DE PRUEBA
-- ============================================
INSERT INTO cliente (nombre, apellido, documento, telefono, email) 
VALUES 
    ('Juan', 'Pérez', '12345678', '555-1234', 'juan.perez@example.com'),
    ('María', 'García', '87654321', '555-5678', 'maria.garcia@example.com'),
    ('Carlos', 'Ramírez', '11223344', '555-1111', 'carlos.ramirez@example.com'),
    ('Ana', 'Martínez', '44332211', '555-2222', 'ana.martinez@example.com'),
    ('Luis', 'González', '99887766', '555-3333', 'luis.gonzalez@example.com')
ON CONFLICT (documento) DO NOTHING;

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
    auto_id UUID;
    moto_id UUID;
    camioneta_id UUID;
BEGIN
    -- Obtener IDs de clientes
    SELECT id INTO juan_id FROM cliente WHERE documento = '12345678';
    SELECT id INTO maria_id FROM cliente WHERE documento = '87654321';
    SELECT id INTO carlos_id FROM cliente WHERE documento = '11223344';
    SELECT id INTO ana_id FROM cliente WHERE documento = '44332211';
    SELECT id INTO luis_id FROM cliente WHERE documento = '99887766';

    -- Obtener IDs de tipos de vehículo
    SELECT id INTO auto_id FROM tipo_vehiculo WHERE nombre = 'Auto';
    SELECT id INTO moto_id FROM tipo_vehiculo WHERE nombre = 'Moto';
    SELECT id INTO camioneta_id FROM tipo_vehiculo WHERE nombre = 'Camioneta';

    -- Insertar vehículos
    INSERT INTO vehiculo (placa, marca, modelo, "clienteId", "tipoVehiculoId") VALUES
        ('ABC-123', 'Toyota', 'Corolla', juan_id, auto_id),
        ('XYZ-789', 'Honda', 'CBR500', maria_id, moto_id),
        ('DEF-456', 'Ford', 'F-150', carlos_id, camioneta_id),
        ('GHI-789', 'Nissan', 'Sentra', ana_id, auto_id),
        ('JKL-012', 'Mazda', 'CX-5', luis_id, camioneta_id)
    ON CONFLICT (placa) DO NOTHING;
END $$;

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================
SELECT 'Secciones' as tabla, COUNT(*) as total FROM seccion
UNION ALL
SELECT 'Espacios', COUNT(*) FROM espacio
UNION ALL
SELECT 'Tipos Vehículo', COUNT(*) FROM tipo_vehiculo
UNION ALL
SELECT 'Tarifas', COUNT(*) FROM tipo_tarifa
UNION ALL
SELECT 'Clientes', COUNT(*) FROM cliente
UNION ALL
SELECT 'Vehículos', COUNT(*) FROM vehiculo;

