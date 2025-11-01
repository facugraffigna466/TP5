-- ==========================================
-- EJEMPLOS DE COMANDOS SQL PARA SQLITE
-- ==========================================
-- 
-- Para usar estos ejemplos:
-- 1. Abre terminal: cd backend
-- 2. Ejecuta: sqlite3 database.sqlite
-- 3. Copia y pega estos comandos
--
-- ==========================================

-- Activar formato bonito
.headers on
.mode column

-- ==========================================
-- VER DATOS
-- ==========================================

-- Ver todas las tareas
SELECT * FROM tareas;

-- Ver solo columnas específicas
SELECT id, titulo, completada FROM tareas;

-- Ver tareas pendientes
SELECT * FROM tareas WHERE completada = 0;

-- Ver tareas completadas
SELECT * FROM tareas WHERE completada = 1;

-- Ver tareas ordenadas por fecha (más recientes primero)
SELECT * FROM tareas ORDER BY fecha_creacion DESC;

-- Ver tareas ordenadas por título (alfabético)
SELECT * FROM tareas ORDER BY titulo ASC;

-- ==========================================
-- CREAR DATOS
-- ==========================================

-- Crear una tarea simple
INSERT INTO tareas (titulo, descripcion) 
VALUES ('Ejemplo desde SQL', 'Esta tarea fue creada manualmente');

-- Crear tarea solo con título
INSERT INTO tareas (titulo) 
VALUES ('Tarea sin descripción');

-- Crear tarea ya completada
INSERT INTO tareas (titulo, descripcion, completada) 
VALUES ('Tarea completada', 'Ya está hecha', 1);

-- ==========================================
-- ACTUALIZAR DATOS
-- ==========================================

-- Marcar tarea como completada (cambiar ID por el que quieras)
UPDATE tareas SET completada = 1 WHERE id = 1;

-- Marcar tarea como pendiente
UPDATE tareas SET completada = 0 WHERE id = 1;

-- Cambiar título de una tarea
UPDATE tareas SET titulo = 'Nuevo título' WHERE id = 1;

-- Cambiar descripción
UPDATE tareas SET descripcion = 'Nueva descripción' WHERE id = 1;

-- Actualizar varios campos a la vez
UPDATE tareas 
SET titulo = 'Título actualizado', 
    descripcion = 'Descripción actualizada',
    completada = 1
WHERE id = 1;

-- Marcar todas las tareas como completadas (¡CUIDADO!)
-- UPDATE tareas SET completada = 1;

-- ==========================================
-- ELIMINAR DATOS
-- ==========================================

-- Eliminar una tarea específica (cambiar ID)
DELETE FROM tareas WHERE id = 1;

-- Eliminar todas las tareas completadas
DELETE FROM tareas WHERE completada = 1;

-- Eliminar tareas que contengan una palabra
DELETE FROM tareas WHERE titulo LIKE '%test%';

-- ¡¡¡CUIDADO!!! Eliminar TODAS las tareas
-- DELETE FROM tareas;

-- ==========================================
-- CONSULTAS AVANZADAS
-- ==========================================

-- Contar total de tareas
SELECT COUNT(*) as total FROM tareas;

-- Contar tareas pendientes y completadas
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN completada = 0 THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completadas
FROM tareas;

-- Buscar tareas por palabra en el título
SELECT * FROM tareas WHERE titulo LIKE '%estudiar%';

-- Buscar tareas por palabra en descripción
SELECT * FROM tareas WHERE descripcion LIKE '%importante%';

-- Ver las 5 tareas más recientes
SELECT * FROM tareas 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- Ver las 3 tareas más antiguas
SELECT * FROM tareas 
ORDER BY fecha_creacion ASC 
LIMIT 3;

-- Tareas creadas hoy
SELECT * FROM tareas 
WHERE DATE(fecha_creacion) = DATE('now');

-- Tareas con descripción vacía o nula
SELECT * FROM tareas 
WHERE descripcion IS NULL OR descripcion = '';

-- Ver estadísticas por día
SELECT 
  DATE(fecha_creacion) as dia,
  COUNT(*) as total_tareas
FROM tareas
GROUP BY DATE(fecha_creacion)
ORDER BY dia DESC;

-- ==========================================
-- VER ESTRUCTURA
-- ==========================================

-- Ver estructura de la tabla
.schema tareas

-- Ver todas las tablas
.tables

-- Ver información de la tabla
PRAGMA table_info(tareas);

-- ==========================================
-- OTROS COMANDOS ÚTILES
-- ==========================================

-- Ver ayuda
.help

-- Cambiar modo de visualización
.mode json        -- Ver en formato JSON
.mode csv         -- Ver en formato CSV
.mode column      -- Ver en columnas (bonito)
.mode line        -- Ver una línea por registro

-- Salir
.quit


