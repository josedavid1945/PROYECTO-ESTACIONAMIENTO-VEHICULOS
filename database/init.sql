-- Script de inicialización para base de datos local de pruebas

-- Tabla de secciones
CREATE TABLE IF NOT EXISTS seccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letra_seccion VARCHAR(10) NOT NULL UNIQUE
);

-- Tabla de espacios
CREATE TABLE IF NOT EXISTS espacio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) NOT NULL UNIQUE,
    estado BOOLEAN NOT NULL DEFAULT true,
    "seccionId" UUID REFERENCES seccion(id)
);

-- Tabla de tipos de vehículo
CREATE TABLE IF NOT EXISTS tipo_vehiculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    "clienteId" UUID REFERENCES cliente(id),
    "tipoVehiculoId" UUID REFERENCES tipo_vehiculo(id)
);

-- Tabla de tarifas
CREATE TABLE IF NOT EXISTS tarifa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    precio_hora DECIMAL(10,2) NOT NULL,
    "tipoVehiculoId" UUID REFERENCES tipo_vehiculo(id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monto DECIMAL(10,2) NOT NULL,
    "tipoTarifaId" UUID REFERENCES tarifa(id)
);

-- Tabla de detalle de pago
CREATE TABLE IF NOT EXISTS detalle_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metodo VARCHAR(50) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pago_total DECIMAL(10,2) NOT NULL,
    "ticketId" UUID,
    "pagoId" UUID REFERENCES pago(id)
);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fechaIngreso" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSalida" TIMESTAMP,
    "vehiculoId" UUID REFERENCES vehiculo(id),
    "espacioId" UUID REFERENCES espacio(id),
    "detallePagoId" UUID REFERENCES detalle_pago(id)
);

-- Agregar FK faltante
ALTER TABLE detalle_pago ADD CONSTRAINT fk_ticket FOREIGN KEY ("ticketId") REFERENCES ticket(id);

-- Datos de prueba
INSERT INTO seccion (id, letra_seccion) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'A'),
    ('22222222-2222-2222-2222-222222222222', 'B'),
    ('33333333-3333-3333-3333-333333333333', 'C');

INSERT INTO espacio (id, numero, estado, "seccionId") VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'A-101', true, '11111111-1111-1111-1111-111111111111'),
    ('a2222222-2222-2222-2222-222222222222', 'A-102', true, '11111111-1111-1111-1111-111111111111'),
    ('b1111111-1111-1111-1111-111111111111', 'B-201', true, '22222222-2222-2222-2222-222222222222'),
    ('b2222222-2222-2222-2222-222222222222', 'B-202', false, '22222222-2222-2222-2222-222222222222'),
    ('c1111111-1111-1111-1111-111111111111', 'C-301', true, '33333333-3333-3333-3333-333333333333'),
    ('c2222222-2222-2222-2222-222222222222', 'C-302', false, '33333333-3333-3333-3333-333333333333');

INSERT INTO tipo_vehiculo (id, nombre, descripcion) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Auto', 'Vehículo liviano'),
    ('22222222-2222-2222-2222-222222222222', 'Moto', 'Motocicleta'),
    ('33333333-3333-3333-3333-333333333333', 'Camioneta', 'Camioneta o SUV');

INSERT INTO cliente (id, nombre, apellido, documento, telefono, email) VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Juan', 'Pérez', '12345678', '555-1234', 'juan@example.com'),
    ('55555555-5555-5555-5555-555555555555', 'María', 'García', '87654321', '555-5678', 'maria@example.com');

INSERT INTO vehiculo (id, placa, marca, modelo, "clienteId", "tipoVehiculoId") VALUES 
    ('66666666-6666-6666-6666-666666666666', 'ABC-123', 'Toyota', 'Corolla', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
    ('77777777-7777-7777-7777-777777777777', 'XYZ-789', 'Honda', 'CBR500', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222');

INSERT INTO tarifa (id, nombre, precio_hora, "tipoVehiculoId") VALUES 
    ('88888888-8888-8888-8888-888888888888', 'Auto - Hora', 15.00, '11111111-1111-1111-1111-111111111111'),
    ('99999999-9999-9999-9999-999999999999', 'Moto - Hora', 8.00, '22222222-2222-2222-2222-222222222222');

-- Tickets activos (sin salida)
INSERT INTO ticket (id, "fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", "detallePagoId") VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, '66666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', NULL),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL, '77777777-7777-7777-7777-777777777777', 'c2222222-2222-2222-2222-222222222222', NULL);

-- Pago de ejemplo
INSERT INTO pago (id, monto, "tipoTarifaId") VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 45.50, '88888888-8888-8888-8888-888888888888');

INSERT INTO detalle_pago (id, metodo, fecha_pago, pago_total, "ticketId", "pagoId") VALUES 
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Efectivo', CURRENT_TIMESTAMP, 45.50, NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_espacio_seccion ON espacio("seccionId");
CREATE INDEX IF NOT EXISTS idx_ticket_vehiculo ON ticket("vehiculoId");
CREATE INDEX IF NOT EXISTS idx_ticket_espacio ON ticket("espacioId");
CREATE INDEX IF NOT EXISTS idx_ticket_fecha_salida ON ticket("fechaSalida");
CREATE INDEX IF NOT EXISTS idx_vehiculo_cliente ON vehiculo("clienteId");

COMMIT;
