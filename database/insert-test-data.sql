-- Datos de prueba para el estacionamiento

-- Insertar vehículos de prueba (usando UUIDs válidos)
INSERT INTO vehiculo (id, placa, marca, modelo, "clienteId") VALUES 
('d1111111-1111-1111-1111-111111111111', 'ABC-1234', 'Toyota', 'Corolla', 'c1111111-1111-1111-1111-111111111111'),
('d2222222-2222-2222-2222-222222222222', 'XYZ-5678', 'Chevrolet', 'Spark', 'c2222222-2222-2222-2222-222222222222'),
('d3333333-3333-3333-3333-333333333333', 'DEF-9012', 'Honda', 'Civic', 'c3333333-3333-3333-3333-333333333333'),
('d4444444-4444-4444-4444-444444444444', 'GHI-3456', 'Hyundai', 'Accent', 'c1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Crear algunos tickets (vehículos estacionados actualmente)
-- Primero marcar algunos espacios como ocupados
UPDATE espacio SET estado = false WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111'
);

-- Insertar tickets activos (sin fecha de salida = vehículos actualmente estacionados)
INSERT INTO ticket (id, "fechaIngreso", "vehiculoId", "espacioId") VALUES 
('e1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 hours', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
('e2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 hour', 'd2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insertar tickets históricos (con fecha de salida = ya salieron)
INSERT INTO ticket (id, "fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", monto_calculado, horas_estacionamiento) VALUES 
('e3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '1 day' - INTERVAL '3 hours', NOW() - INTERVAL '1 day', 'd3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 7.50, 3),
('e4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '2 days' - INTERVAL '5 hours', NOW() - INTERVAL '2 days', 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 12.50, 5)
ON CONFLICT (id) DO NOTHING;
