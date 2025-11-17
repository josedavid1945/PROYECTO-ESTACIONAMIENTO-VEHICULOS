-- ============================================
-- DATOS DE PRUEBA - SISTEMA DE ESTACIONAMIENTO
-- Siguiendo el flujo del sistema
-- ============================================

-- 1. SECCIONES (4 secciones: A, B, C, D)
-- ============================================
INSERT INTO seccion (letra_seccion) 
VALUES 
    ('A'),
    ('B'),
    ('C'),
    ('D')
ON CONFLICT (letra_seccion) DO NOTHING;

-- ============================================
-- 2. ESPACIOS (60 espacios distribuidos en 4 secciones)
-- ============================================
DO $$
DECLARE
    seccion_a_id UUID;
    seccion_b_id UUID;
    seccion_c_id UUID;
    seccion_d_id UUID;
BEGIN
    -- Obtener IDs de secciones
    SELECT id INTO seccion_a_id FROM seccion WHERE letra_seccion = 'A';
    SELECT id INTO seccion_b_id FROM seccion WHERE letra_seccion = 'B';
    SELECT id INTO seccion_c_id FROM seccion WHERE letra_seccion = 'C';
    SELECT id INTO seccion_d_id FROM seccion WHERE letra_seccion = 'D';

    -- Espacios Sección A (101-115) - 15 espacios
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('A-101', true, seccion_a_id),
        ('A-102', true, seccion_a_id),
        ('A-103', true, seccion_a_id),
        ('A-104', true, seccion_a_id),
        ('A-105', true, seccion_a_id),
        ('A-106', true, seccion_a_id),
        ('A-107', true, seccion_a_id),
        ('A-108', true, seccion_a_id),
        ('A-109', true, seccion_a_id),
        ('A-110', true, seccion_a_id),
        ('A-111', true, seccion_a_id),
        ('A-112', true, seccion_a_id),
        ('A-113', true, seccion_a_id),
        ('A-114', true, seccion_a_id),
        ('A-115', true, seccion_a_id)
    ON CONFLICT (numero) DO NOTHING;

    -- Espacios Sección B (201-215) - 15 espacios
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('B-201', true, seccion_b_id),
        ('B-202', true, seccion_b_id),
        ('B-203', true, seccion_b_id),
        ('B-204', true, seccion_b_id),
        ('B-205', true, seccion_b_id),
        ('B-206', true, seccion_b_id),
        ('B-207', true, seccion_b_id),
        ('B-208', true, seccion_b_id),
        ('B-209', true, seccion_b_id),
        ('B-210', true, seccion_b_id),
        ('B-211', true, seccion_b_id),
        ('B-212', true, seccion_b_id),
        ('B-213', true, seccion_b_id),
        ('B-214', true, seccion_b_id),
        ('B-215', true, seccion_b_id)
    ON CONFLICT (numero) DO NOTHING;

    -- Espacios Sección C (301-315) - 15 espacios
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('C-301', true, seccion_c_id),
        ('C-302', true, seccion_c_id),
        ('C-303', true, seccion_c_id),
        ('C-304', true, seccion_c_id),
        ('C-305', true, seccion_c_id),
        ('C-306', true, seccion_c_id),
        ('C-307', true, seccion_c_id),
        ('C-308', true, seccion_c_id),
        ('C-309', true, seccion_c_id),
        ('C-310', true, seccion_c_id),
        ('C-311', true, seccion_c_id),
        ('C-312', true, seccion_c_id),
        ('C-313', true, seccion_c_id),
        ('C-314', true, seccion_c_id),
        ('C-315', true, seccion_c_id)
    ON CONFLICT (numero) DO NOTHING;

    -- Espacios Sección D (401-415) - 15 espacios
    INSERT INTO espacio (numero, estado, "seccionId") VALUES
        ('D-401', true, seccion_d_id),
        ('D-402', true, seccion_d_id),
        ('D-403', true, seccion_d_id),
        ('D-404', true, seccion_d_id),
        ('D-405', true, seccion_d_id),
        ('D-406', true, seccion_d_id),
        ('D-407', true, seccion_d_id),
        ('D-408', true, seccion_d_id),
        ('D-409', true, seccion_d_id),
        ('D-410', true, seccion_d_id),
        ('D-411', true, seccion_d_id),
        ('D-412', true, seccion_d_id),
        ('D-413', true, seccion_d_id),
        ('D-414', true, seccion_d_id),
        ('D-415', true, seccion_d_id)
    ON CONFLICT (numero) DO NOTHING;
END $$;

-- ============================================
-- 3. TIPOS DE VEHÍCULO
-- ============================================
INSERT INTO tipo_vehiculo (categoria, descripcion) 
VALUES 
    ('Auto', 'Vehículo liviano de 4 ruedas'),
    ('Moto', 'Motocicleta de 2 ruedas'),
    ('Camioneta', 'Camioneta pickup o SUV'),
    ('Camión', 'Camión de carga mediana')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. TARIFAS (basadas en tipo de vehículo)
-- ============================================
DO $$
DECLARE
    auto_id UUID;
    moto_id UUID;
    camioneta_id UUID;
    camion_id UUID;
BEGIN
    -- Obtener IDs de tipos de vehículo
    SELECT id INTO auto_id FROM tipo_vehiculo WHERE categoria = 'Auto';
    SELECT id INTO moto_id FROM tipo_vehiculo WHERE categoria = 'Moto';
    SELECT id INTO camioneta_id FROM tipo_vehiculo WHERE categoria = 'Camioneta';
    SELECT id INTO camion_id FROM tipo_vehiculo WHERE categoria = 'Camión';

    -- Insertar tarifas por hora
    INSERT INTO tipo_tarifa (descripcion, "precioHora", "tipoVehiculoId") VALUES
        ('Tarifa Auto - $2.00/hora', 2.00, auto_id),
        ('Tarifa Moto - $1.00/hora', 1.00, moto_id),
        ('Tarifa Camioneta - $3.00/hora', 3.00, camioneta_id),
        ('Tarifa Camión - $5.00/hora', 5.00, camion_id);
END $$;

-- ============================================
-- 5. TIPOS DE MULTA
-- ============================================
INSERT INTO tipo_multa (nombre, descripcion, monto) 
VALUES 
    ('Exceso de Velocidad', 'Exceder límite de velocidad dentro del estacionamiento', 15.00),
    ('Estacionamiento Indebido', 'Estacionar fuera de las líneas demarcadas', 20.00),
    ('Doble Fila', 'Obstruir paso de otros vehículos', 25.00),
    ('No Respetar Señalización', 'Ignorar señales de tránsito interno', 18.00),
    ('Ocupar Espacio Reservado', 'Usar espacios para discapacitados sin autorización', 50.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CLIENTES DE PRUEBA (15 clientes)
-- ============================================
INSERT INTO cliente (nombre, email, telefono) 
VALUES 
    ('Juan Pérez', 'juan.perez@email.com', '0991234567'),
    ('María García', 'maria.garcia@email.com', '0992345678'),
    ('Carlos Ramírez', 'carlos.ramirez@email.com', '0993456789'),
    ('Ana Martínez', 'ana.martinez@email.com', '0994567890'),
    ('Luis González', 'luis.gonzalez@email.com', '0995678901'),
    ('Sofia López', 'sofia.lopez@email.com', '0996789012'),
    ('Diego Torres', 'diego.torres@email.com', '0997890123'),
    ('Carmen Ruiz', 'carmen.ruiz@email.com', '0998901234'),
    ('Roberto Silva', 'roberto.silva@email.com', '0999012345'),
    ('Patricia Morales', 'patricia.morales@email.com', '0990123456'),
    ('Fernando Castro', 'fernando.castro@email.com', '0991111111'),
    ('Isabel Vargas', 'isabel.vargas@email.com', '0992222222'),
    ('Miguel Ortiz', 'miguel.ortiz@email.com', '0993333333'),
    ('Laura Mendoza', 'laura.mendoza@email.com', '0994444444'),
    ('Andrés Rojas', 'andres.rojas@email.com', '0995555555')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. VEHÍCULOS DE PRUEBA (20 vehículos variados)
-- ============================================
DO $$
DECLARE
    auto_id UUID;
    moto_id UUID;
    camioneta_id UUID;
    camion_id UUID;
    cliente_ids UUID[];
BEGIN
    -- Obtener IDs de tipos de vehículo
    SELECT id INTO auto_id FROM tipo_vehiculo WHERE categoria = 'Auto';
    SELECT id INTO moto_id FROM tipo_vehiculo WHERE categoria = 'Moto';
    SELECT id INTO camioneta_id FROM tipo_vehiculo WHERE categoria = 'Camioneta';
    SELECT id INTO camion_id FROM tipo_vehiculo WHERE categoria = 'Camión';

    -- Obtener IDs de clientes en orden
    SELECT ARRAY_AGG(id ORDER BY nombre) INTO cliente_ids FROM cliente LIMIT 15;

    -- Insertar vehículos (distribuidos entre los clientes)
    INSERT INTO vehiculo (placa, marca, modelo, "clienteId", "tipoVehiculoId") VALUES
        -- Autos (10)
        ('ABC-1234', 'Toyota', 'Corolla', cliente_ids[1], auto_id),
        ('XYZ-5678', 'Honda', 'Civic', cliente_ids[2], auto_id),
        ('DEF-9012', 'Nissan', 'Sentra', cliente_ids[3], auto_id),
        ('GHI-3456', 'Chevrolet', 'Spark', cliente_ids[4], auto_id),
        ('JKL-7890', 'Hyundai', 'Accent', cliente_ids[5], auto_id),
        ('MNO-2345', 'Mazda', '3', cliente_ids[6], auto_id),
        ('PQR-6789', 'Kia', 'Rio', cliente_ids[7], auto_id),
        ('STU-0123', 'Volkswagen', 'Jetta', cliente_ids[8], auto_id),
        ('VWX-4567', 'Ford', 'Focus', cliente_ids[9], auto_id),
        ('YZA-8901', 'Renault', 'Logan', cliente_ids[10], auto_id),
        
        -- Motos (5)
        ('MOT-1111', 'Yamaha', 'FZ-16', cliente_ids[11], moto_id),
        ('MOT-2222', 'Honda', 'CBR 250', cliente_ids[12], moto_id),
        ('MOT-3333', 'Suzuki', 'Gixxer', cliente_ids[13], moto_id),
        ('MOT-4444', 'Kawasaki', 'Ninja 300', cliente_ids[14], moto_id),
        ('MOT-5555', 'Bajaj', 'Pulsar', cliente_ids[15], moto_id),
        
        -- Camionetas (4)
        ('CAM-1111', 'Toyota', 'Hilux', cliente_ids[1], camioneta_id),
        ('CAM-2222', 'Ford', 'Ranger', cliente_ids[3], camioneta_id),
        ('CAM-3333', 'Chevrolet', 'D-Max', cliente_ids[5], camioneta_id),
        ('CAM-4444', 'Nissan', 'Frontier', cliente_ids[7], camioneta_id),
        
        -- Camión (1)
        ('CMN-1111', 'Hino', '500 Series', cliente_ids[9], camion_id)
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

