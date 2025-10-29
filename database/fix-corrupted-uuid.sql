-- Script para limpiar UUIDs corruptos con saltos de línea
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Ver los registros afectados
SELECT id, numero, "seccionId", estado 
FROM espacio 
WHERE "seccionId"::text LIKE '%' || chr(10) || '%' 
   OR "seccionId"::text LIKE '%' || chr(13) || '%';

-- 2. Limpiar los UUIDs corruptos (quita saltos de línea y espacios)
UPDATE espacio 
SET "seccionId" = TRIM(BOTH FROM REPLACE(REPLACE("seccionId"::text, chr(10), ''), chr(13), ''))::uuid
WHERE "seccionId"::text LIKE '%' || chr(10) || '%' 
   OR "seccionId"::text LIKE '%' || chr(13) || '%';

-- 3. Verificar que se limpiaron correctamente
SELECT id, numero, "seccionId", estado 
FROM espacio 
WHERE LENGTH("seccionId"::text) != 36;  -- Los UUIDs deben tener exactamente 36 caracteres
