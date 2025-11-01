# 📚 Guía de SQLite - Para Principiantes

## ¿Qué es SQLite?

SQLite es una **base de datos ligera** que almacena todos los datos en un **único archivo**. Es perfecta para aplicaciones pequeñas y medianas.

### Características principales:

✅ **No necesita servidor** - Es solo un archivo  
✅ **No requiere configuración** - Se crea automáticamente  
✅ **Muy rápida** - Para aplicaciones pequeñas/medianas  
✅ **Portable** - Un solo archivo con toda la base de datos  
✅ **SQL completo** - Usa el lenguaje SQL estándar  

---

## 🗄️ Estructura de tu Base de Datos

Tu base de datos está en: `backend/database.sqlite`

Es un **archivo físico** que puedes ver, copiar, respaldar, etc.

### Estructura de la Tabla `tareas`:

```sql
CREATE TABLE tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- ID único, se auto-incrementa
  titulo TEXT NOT NULL,                     -- Título obligatorio
  descripcion TEXT,                        -- Descripción opcional
  completada INTEGER DEFAULT 0,            -- 0 = pendiente, 1 = completada
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP  -- Fecha automática
);
```

**Explicación de cada campo:**
- `id`: Número único que identifica cada tarea (1, 2, 3...)
- `titulo`: El nombre de la tarea (ej: "Comprar leche")
- `descripcion`: Detalles adicionales (ej: "2 litros, descremada")
- `completada`: 0 = pendiente, 1 = hecha
- `fecha_creacion`: Cuándo se creó la tarea (automático)

---

## 🎯 Operaciones Básicas (CRUD)

### CREATE - Crear Registros

```sql
-- Crear una nueva tarea
INSERT INTO tareas (titulo, descripcion) 
VALUES ('Estudiar SQL', 'Aprender comandos básicos');
```

**En tu aplicación:** Se hace automáticamente cuando haces clic en "Agregar Tarea" en el frontend.

### READ - Leer Registros

```sql
-- Ver todas las tareas
SELECT * FROM tareas;

-- Ver solo tareas pendientes
SELECT * FROM tareas WHERE completada = 0;

-- Ver solo tareas completadas
SELECT * FROM tareas WHERE completada = 1;

-- Contar tareas
SELECT COUNT(*) FROM tareas;

-- Ver una tarea específica por ID
SELECT * FROM tareas WHERE id = 1;
```

### UPDATE - Actualizar Registros

```sql
-- Marcar una tarea como completada
UPDATE tareas 
SET completada = 1 
WHERE id = 1;

-- Cambiar el título de una tarea
UPDATE tareas 
SET titulo = 'Nuevo título' 
WHERE id = 1;

-- Actualizar varios campos
UPDATE tareas 
SET titulo = 'Título nuevo', 
    descripcion = 'Descripción nueva',
    completada = 1
WHERE id = 1;
```

**En tu aplicación:** Se hace cuando marcas el checkbox de una tarea.

### DELETE - Eliminar Registros

```sql
-- Eliminar una tarea específica
DELETE FROM tareas WHERE id = 1;

-- Eliminar todas las tareas completadas
DELETE FROM tareas WHERE completada = 1;

-- ¡CUIDADO! Eliminar TODAS las tareas
DELETE FROM tareas;
```

**En tu aplicación:** Se hace cuando haces clic en el botón de eliminar (🗑️).

---

## 🔧 Cómo se Usa en tu Proyecto

### 1. **Backend (server.js)**

El backend usa la librería `sqlite3` para comunicarse con la base de datos:

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// Crear tabla (solo la primera vez)
db.run('CREATE TABLE IF NOT EXISTS tareas (...)');

// Insertar dato
db.run('INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)', 
  ['Título', 'Descripción'], 
  function(err) {
    if (err) console.error(err);
    else console.log('ID:', this.lastID);
  }
);

// Leer datos
db.all('SELECT * FROM tareas', (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
});
```

### 2. **Flujo Completo en tu App**

```
1. Usuario escribe tarea en el frontend
   ↓
2. Frontend envía POST /api/tareas al backend
   ↓
3. Backend ejecuta INSERT en SQLite
   ↓
4. SQLite guarda en database.sqlite
   ↓
5. Backend responde con la nueva tarea
   ↓
6. Frontend muestra la tarea en pantalla
```

---

## 🛠️ Comandos Prácticos para Probar

### Ver la base de datos interactivamente:

```bash
cd backend
sqlite3 database.sqlite
```

Una vez dentro, puedes escribir comandos SQL:

```sql
-- Activar encabezados y formato bonito
.headers on
.mode column

-- Ver todas las tareas
SELECT * FROM tareas;

-- Crear una tarea manualmente
INSERT INTO tareas (titulo, descripcion) 
VALUES ('Tarea desde SQL', 'Descripción de prueba');

-- Ver solo tareas pendientes
SELECT id, titulo, descripcion FROM tareas WHERE completada = 0;

-- Buscar tareas que contengan una palabra
SELECT * FROM tareas WHERE titulo LIKE '%estudiar%';

-- Ordenar por fecha
SELECT * FROM tareas ORDER BY fecha_creacion DESC;

-- Ver estadísticas
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN completada = 0 THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completadas
FROM tareas;

-- Salir
.quit
```

---

## 📊 Tipos de Datos en SQLite

SQLite tiene tipos simples:

- **INTEGER**: Números enteros (1, 2, 100, -5)
- **TEXT**: Texto/cadenas ("Hola", "Ejemplo")
- **REAL**: Números decimales (3.14, 2.5)
- **BLOB**: Datos binarios (imágenes, archivos)
- **NULL**: Valor vacío

**Nota:** SQLite es flexible - puedes guardar texto en campos INTEGER, pero no es recomendable.

---

## 🔍 Comandos Especiales de SQLite (punto .)

Estos comandos empiezan con punto (.) y son específicos de SQLite:

```sql
.tables           -- Ver todas las tablas
.schema           -- Ver estructura de todas las tablas
.schema tareas    -- Ver estructura de una tabla específica
.headers on       -- Mostrar encabezados de columnas
.mode column      -- Modo de visualización en columnas
.mode json        -- Modo JSON
.mode csv         -- Modo CSV
.width 10 20 30   -- Ancho de columnas
.output archivo.txt  -- Guardar resultado en archivo
.quit             -- Salir
.help             -- Ver ayuda
```

---

## 💡 Ejemplos de Consultas Útiles

```sql
-- Top 5 tareas más recientes
SELECT * FROM tareas 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- Tareas creadas hoy
SELECT * FROM tareas 
WHERE DATE(fecha_creacion) = DATE('now');

-- Tareas con descripción vacía
SELECT * FROM tareas 
WHERE descripcion IS NULL OR descripcion = '';

-- Promedio de tareas completadas por día
SELECT 
  DATE(fecha_creacion) as dia,
  COUNT(*) as total,
  SUM(completada) as completadas
FROM tareas
GROUP BY DATE(fecha_creacion);

-- Tareas más antiguas sin completar
SELECT * FROM tareas 
WHERE completada = 0 
ORDER BY fecha_creacion ASC 
LIMIT 10;
```

---

## 🔄 Comparación: SQLite vs Otras Bases de Datos

| Característica | SQLite | MySQL/PostgreSQL |
|---------------|--------|-----------------|
| **Servidor** | ❌ No necesita | ✅ Necesita servidor |
| **Configuración** | ⚡ Muy fácil | 🔧 Más complejo |
| **Archivo** | 📁 Un solo archivo | 📂 Varios archivos |
| **Portabilidad** | ✅ Muy portable | ⚠️ Menos portable |
| **Tamaño** | 💾 Muy ligero | 💾 Más pesado |
| **Uso ideal** | Apps pequeñas/medianas | Apps grandes/empresariales |

---

## 🎓 Próximos Pasos

1. **Experimenta con comandos SQL** usando `sqlite3 database.sqlite`
2. **Prueba crear/leer/actualizar/eliminar** datos manualmente
3. **Revisa el código** en `backend/server.js` para ver cómo se usan las queries
4. **Agrega campos nuevos** a la tabla si lo necesitas

---

## 📝 Resumen Rápido

✅ SQLite es una base de datos en un archivo  
✅ Usa SQL estándar para hacer consultas  
✅ En tu proyecto, el backend (Node.js) se comunica con SQLite  
✅ El frontend nunca toca SQLite directamente - todo pasa por la API  
✅ Puedes ver/modificar datos usando `sqlite3` desde la terminal  

**Tu base de datos está en:** `backend/database.sqlite`

