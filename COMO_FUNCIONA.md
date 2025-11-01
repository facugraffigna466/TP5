# 🔄 Cómo Funciona la Aplicación - Flujo Completo

## 🎯 Concepto Principal

**El frontend NUNCA toca la base de datos directamente.** Todo pasa por el backend (API).

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  FRONTEND   │ ──────> │   BACKEND   │ ──────> │  SQLite DB  │
│   (React)   │         │  (Express)  │         │  (Archivo)  │
│             │ <────── │             │ <────── │             │
└─────────────┘         └─────────────┘         └─────────────┘
   Puerto 5173             Puerto 3001          database.sqlite
```

---

## 📋 Ejemplo: Agregar una Tarea

### Paso 1: Usuario en el Frontend
```
Usuario escribe en el formulario:
- Título: "Comprar leche"
- Descripción: "2 litros"

Hace clic en "Agregar Tarea"
```

### Paso 2: Frontend hace Petición HTTP
```javascript
// En App.jsx (frontend)
axios.post('http://localhost:3001/api/tareas', {
  titulo: 'Comprar leche',
  descripcion: '2 litros'
})
```

### Paso 3: Backend Recibe la Petición
```javascript
// En server.js (backend)
app.post('/api/tareas', (req, res) => {
  const { titulo, descripcion } = req.body;
  // titulo = 'Comprar leche'
  // descripcion = '2 litros'
```

### Paso 4: Backend Habla con SQLite
```javascript
// En server.js (backend)
db.run(
  'INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)',
  [titulo, descripcion],
  function(err) {
    // SQLite guarda en database.sqlite
  }
);
```

### Paso 5: SQLite Guarda el Dato
```
Archivo: backend/database.sqlite
Nueva fila agregada:
id=3, titulo='Comprar leche', descripcion='2 litros', completada=0
```

### Paso 6: Backend Responde al Frontend
```javascript
// En server.js (backend)
res.status(201).json({
  id: 3,
  titulo: 'Comprar leche',
  descripcion: '2 litros',
  completada: 0,
  fecha_creacion: '2025-11-01...'
});
```

### Paso 7: Frontend Muestra el Resultado
```javascript
// En App.jsx (frontend)
setTareas([nuevaTarea, ...tareas]); // Agrega a la lista
// La interfaz se actualiza automáticamente
```

---

## 🔍 Cómo Funciona SQLite en tu Código

### 1. **Conexión a la Base de Datos**

```javascript
// En server.js - línea 14-15
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);
```

**¿Qué hace esto?**
- Crea o abre el archivo `database.sqlite`
- Si no existe, lo crea automáticamente
- Establece una "conexión" al archivo

### 2. **Crear la Tabla (Solo la Primera Vez)**

```javascript
// En server.js - línea 18-28
db.run(`
  CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    completada INTEGER DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

**¿Qué hace esto?**
- Crea una tabla llamada "tareas" si no existe
- Define las columnas (campos) que tendrá
- Solo se ejecuta la primera vez que corre el servidor

### 3. **Operaciones Comunes**

#### INSERT - Crear Registro
```javascript
// En server.js - línea 64-79
db.run(
  'INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)',
  [titulo, descripcion],
  function(err) {
    // err = null si salió bien
    // this.lastID = el ID del nuevo registro
  }
);
```

**¿Qué hace?**
- Inserta una nueva fila en la tabla
- `?` son "placeholders" para prevenir inyección SQL
- Los valores van en el array `[titulo, descripcion]`

#### SELECT - Leer Registros
```javascript
// En server.js - línea 33-39
db.all('SELECT * FROM tareas ORDER BY fecha_creacion DESC', (err, rows) => {
  if (err) {
    return res.status(500).json({ error: err.message });
  }
  res.json(rows); // rows es un array con todas las tareas
});
```

**¿Qué hace?**
- Lee todas las filas de la tabla "tareas"
- `rows` es un array: `[{id:1, titulo:'...'}, {id:2, ...}]`
- Las ordena por fecha (más recientes primero)

#### UPDATE - Actualizar Registro
```javascript
// En server.js - línea 87-99
db.run(
  'UPDATE tareas SET titulo = ?, descripcion = ?, completada = ? WHERE id = ?',
  [titulo, descripcion, completada ? 1 : 0, id],
  function(err) {
    // this.changes = cuántas filas se actualizaron (debe ser 1)
  }
);
```

**¿Qué hace?**
- Modifica una fila existente
- Solo la fila donde `id = ?` (el ID que pasas)

#### DELETE - Eliminar Registro
```javascript
// En server.js - línea 105-113
db.run('DELETE FROM tareas WHERE id = ?', [id], function(err) {
  // this.changes = cuántas filas se eliminaron (debe ser 1)
});
```

**¿Qué hace?**
- Elimina la fila con el ID especificado

---

## 🛠️ Tipos de Operaciones SQLite

### Síncronas vs Asíncronas

En Node.js, SQLite tiene dos formas de trabajar:

**1. Callbacks (lo que usamos):**
```javascript
db.all('SELECT * FROM tareas', (err, rows) => {
  // Este código se ejecuta DESPUÉS de que termine la consulta
  if (err) console.error(err);
  else console.log(rows);
});
```

**2. Promesas (más moderno):**
```javascript
const rows = await db.all('SELECT * FROM tareas');
```

---

## 📊 Estructura del Archivo SQLite

Tu archivo `database.sqlite` contiene:

```
database.sqlite (archivo binario)
│
├── Metadatos (información sobre las tablas)
│   └── Tabla: tareas
│       ├── Columna: id (INTEGER)
│       ├── Columna: titulo (TEXT)
│       ├── Columna: descripcion (TEXT)
│       ├── Columna: completada (INTEGER)
│       └── Columna: fecha_creacion (DATETIME)
│
└── Datos (las filas reales)
    ├── Fila 1: {id:1, titulo:"...", ...}
    ├── Fila 2: {id:2, titulo:"...", ...}
    └── ...
```

---

## 🔐 Seguridad: ¿Por qué Usar Placeholders (?)?

### ❌ MAL - Vulnerable a Inyección SQL:
```javascript
db.run(`INSERT INTO tareas (titulo) VALUES ('${titulo}')`);
// Si titulo = "'; DROP TABLE tareas; --"
// ¡Tu base de datos se borra!
```

### ✅ BIEN - Seguro:
```javascript
db.run('INSERT INTO tareas (titulo) VALUES (?)', [titulo]);
// SQLite escapa automáticamente los valores
```

---

## 🎓 Resumen: El Flujo Completo

```
1. Usuario interactúa con React (frontend)
   ↓
2. React llama a axios.post() o axios.get()
   ↓
3. HTTP request va al servidor Express (backend)
   ↓
4. Express ejecuta db.run() o db.all()
   ↓
5. SQLite lee/escribe en database.sqlite (archivo)
   ↓
6. SQLite devuelve resultado a Express
   ↓
7. Express envía JSON al frontend
   ↓
8. React actualiza la interfaz
```

---

## 💡 Conceptos Clave

✅ **SQLite es solo un archivo** - No hay servidor de base de datos  
✅ **El backend (Node.js) es el "intermediario"** - Conecta frontend con SQLite  
✅ **SQL es el lenguaje** - Se usa para todas las operaciones  
✅ **Las "interfaces" son las funciones del backend** - `/api/tareas`, `/api/tareas/:id`, etc.  
✅ **El frontend nunca toca SQLite directamente** - Todo pasa por la API  

---

## 🧪 Prueba Práctica

1. **Abre tu app en el navegador** (`http://localhost:5173`)
2. **Agrega una tarea** desde la interfaz
3. **Verifica en SQLite** que se guardó:
   ```bash
   cd backend
   sqlite3 database.sqlite "SELECT * FROM tareas ORDER BY id DESC LIMIT 1;"
   ```

¡Verás que los datos están ahí! 🎉

