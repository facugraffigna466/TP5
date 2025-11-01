# Aplicación de Gestión de Tareas

Una aplicación web simple con frontend (React), backend (Node.js/Express) y base de datos (SQLite).

## 📁 Estructura del Proyecto

```
Pagina-tp5/
├── backend/
│   ├── server.js          # Servidor Express con API REST
│   ├── package.json       # Dependencias del backend
│   └── database.sqlite    # Base de datos SQLite (se crea automáticamente)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   ├── App.css        # Estilos de la aplicación
│   │   ├── main.jsx       # Punto de entrada
│   │   └── index.css      # Estilos globales
│   ├── index.html         # HTML principal
│   ├── vite.config.js     # Configuración de Vite
│   └── package.json       # Dependencias del frontend
└── README.md
```

## 🚀 Instalación y Ejecución

### Opción 1: Script Automático (Recomendado)

```bash
# Iniciar todo automáticamente
./start.sh
```

Esto iniciará el backend y el frontend, liberando puertos si es necesario.

### Opción 2: Manual (Dos Terminales)

#### Backend

1. Navegar a la carpeta del backend:
```bash
cd backend
```

2. Instalar dependencias (solo la primera vez):
```bash
npm install
```

3. Si el puerto 3001 está ocupado, detener el proceso:
```bash
# Detener procesos en puerto 3001
lsof -ti:3001 | xargs kill -9
```

4. Iniciar el servidor:
```bash
npm start
```

El servidor correrá en `http://localhost:3001`

#### Frontend

1. Abrir una nueva terminal y navegar a la carpeta del frontend:
```bash
cd frontend
```

2. Instalar dependencias (solo la primera vez):
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Detener Servidores

```bash
# Detener todos los servidores
./stop.sh
```

## 📡 API Endpoints

- `GET /api/tareas` - Obtener todas las tareas
- `GET /api/tareas/:id` - Obtener una tarea por ID
- `POST /api/tareas` - Crear una nueva tarea
- `PUT /api/tareas/:id` - Actualizar una tarea
- `DELETE /api/tareas/:id` - Eliminar una tarea
- `GET /health` - Health check del servidor

## 🗄️ Base de Datos

La aplicación usa SQLite. La base de datos se crea automáticamente al iniciar el servidor.

> 📚 **¿Nunca usaste SQLite?** Revisa estos archivos:
> - `GUIA_SQLITE.md` - Guía completa para principiantes
> - `COMO_FUNCIONA.md` - Cómo se conectan frontend, backend y base de datos
> - `backend/prueba-sqlite.sh` - Tutorial interactivo paso a paso
> - `backend/ejemplos-sqlite.sql` - Ejemplos de comandos SQL

Estructura de la tabla `tareas`:
- `id` (INTEGER PRIMARY KEY)
- `titulo` (TEXT)
- `descripcion` (TEXT)
- `completada` (INTEGER, 0 o 1)
- `fecha_creacion` (DATETIME)

### Ver la Base de Datos

#### Opción 1: Script Automático (Recomendado)
```bash
cd backend
./view-db-pretty.sh
```

O la versión simple:
```bash
./view-db.sh
```

#### Opción 2: Desde la Terminal

```bash
cd backend
sqlite3 database.sqlite
```

Comandos útiles dentro de sqlite3:
```sql
.tables                    -- Ver todas las tablas
.schema tareas            -- Ver estructura de la tabla
SELECT * FROM tareas;     -- Ver todos los registros
.headers on               -- Activar encabezados
.mode column              -- Modo columnas
.quit                     -- Salir
```

#### Opción 3: Consultas Directas

```bash
# Ver todos los registros
sqlite3 backend/database.sqlite "SELECT * FROM tareas;"

# Ver con formato bonito
sqlite3 -header -column backend/database.sqlite "SELECT * FROM tareas;"

# Contar tareas
sqlite3 backend/database.sqlite "SELECT COUNT(*) FROM tareas;"
```

## 🌐 Variables de Entorno

Para producción, puedes configurar:

- `PORT`: Puerto del servidor backend (default: 3001)
- `VITE_API_URL`: URL del API backend (default: http://localhost:3001)

## 📝 Funcionalidades

- ✅ Crear nuevas tareas
- ✅ Marcar tareas como completadas/pendientes
- ✅ Eliminar tareas
- ✅ Ver estadísticas (total, pendientes, completadas)
- ✅ Interfaz moderna y responsive

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18, Vite, Axios
- **Backend**: Node.js, Express, SQLite3
- **Estilos**: CSS puro con diseño moderno

