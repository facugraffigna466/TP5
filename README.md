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
- `GET /api/tareas/resumen` - Métricas agregadas (pendientes, completadas, favoritas, próximas vencimientos)
- `GET /health` - Health check del servidor

### Parámetros de consulta soportados
- `estado` (`pendientes` | `completadas`)
- `prioridad` (`alta` | `media` | `baja`)
- `vencidas` (`true`)
- `orden` (`vencimiento_asc` | `vencimiento_desc`)
- `q` (búsqueda por título o descripción)
- `categoria` (filtro exacto por categoría)
- `favoritas` (`true` para solo favoritas)

## 🗄️ Base de Datos

La aplicación usa SQLite. La base de datos se crea automáticamente al iniciar el servidor.

> 📚 **¿Nunca usaste SQLite?** Revisa estos archivos:
> - `GUIA_SQLITE.md` - Guía completa para principiantes
> - `COMO_FUNCIONA.md` - Cómo se conectan frontend, backend y base de datos
> - `backend/prueba-sqlite.sh` - Tutorial interactivo paso a paso
> - `backend/ejemplos-sqlite.sql` - Ejemplos de comandos SQL

Estructura de la tabla `tareas`:
- `id` (INTEGER PRIMARY KEY)
- `titulo` (TEXT, único e indispensable)
- `descripcion` (TEXT, máx. 200 caracteres)
- `completada` (INTEGER, 0 o 1)
- `fecha_creacion` (DATETIME)
- `prioridad` (TEXT, valores: alta | media | baja, por defecto media)
- `fecha_vencimiento` (DATETIME, opcional y no puede estar en el pasado)
- `categoria` (TEXT, opcional, máx. 30 caracteres)

> ⚠️ **Reglas de negocio clave**
> - El título debe ser único sin distinguir mayúsculas/minúsculas.
> - No se pueden tener más de 5 tareas de prioridad alta pendientes.
> - Las fechas de vencimiento deben ser futuras.

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

- ✅ Crear nuevas tareas con prioridad, fecha de vencimiento y categoría
- ✅ Marcar tareas como completadas/pendientes con validación de límites
- ✅ Eliminar tareas con confirmación
- ✅ Ver estadísticas (total, pendientes, completadas, vencidas)
- ✅ Filtrar por estado, prioridad, categoría, favoritas, vencidas y ordenar por vencimiento
- ✅ Buscar por texto en títulos y descripciones
- ✅ Marcar tareas como favoritas y gestionarlas desde la UI
- ✅ Dashboard con resumen general, próximos vencimientos y top de categorías
- ✅ Interfaz moderna y responsive con badges informativos (prioridad, categoría, favorita, vencimiento)

## 🧪 Testing y Cobertura

El proyecto incluye suites separadas para backend y frontend.

### Backend (Jest + Supertest)
```bash
cd backend
npm install        # ejecutar al menos una vez para instalar devDependencies
npm test           # ejecutar suite completa
npm run test:watch # modo interactivo
npm run test:coverage
```

Los tests cubren:
- Validaciones de negocio (unicidad, límites de longitud, fechas, prioridades).
- Casos borde y manejo de errores (duplicados, límites de alta prioridad, excepciones SQLite).
- Endpoints REST completos (`GET/POST/PUT/DELETE`, filtros, búsqueda, favoritas y health-check).
- Resumen agregado (`/api/tareas/resumen`) y métricas derivadas.
- Verificación del esquema de la base de datos (incluyendo nuevas columnas).

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm install
npm test              # corre una vez
npm run test:watch    # modo interactivo
npm run test:coverage # reporte de cobertura
```

Los tests cubren:
- Render inicial con estadísticas y métricas.
- Manejo de errores en carga y creación de tareas (mockeando Axios).
- Creación de tareas, refresco de datos y validaciones del formulario.
- Aplicación de filtros (estado, prioridad, categoría, favoritas, vencidas), ordenamientos y búsqueda por texto.
- Toggle de completado y favoritas, eliminación con confirmación y badges de prioridad/vencimiento/categoría.
- Actualización del dashboard de resumen (próximas tareas y top de categorías).

### End-to-End (Cypress)
```bash
cd frontend
npm install             # instala cypress y start-server-and-test
npm run cypress:open    # modo GUI
npm run cypress:run     # modo headless
npm run e2e             # levanta el dev server y ejecuta el suite
```

> ⚠️ Necesitás que el backend (`npm run dev` en `/backend`) esté corriendo antes de ejecutar los e2e, o bien ajustar el script `npm run e2e` para levantarlo automáticamente.

Los escenarios end-to-end validan:
- Creación de tareas desde la UI, marcado como favorita y alternancia de estado.
- Uso de búsqueda y filtros “Solo favoritas”.
- Limpieza automática del listado entre pruebas mediante llamadas reales a `/api/tareas`.

> 📈 Ambos entornos generan reportes de cobertura HTML en sus respectivas carpetas `coverage/`.

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18, Vite, Axios
- **Backend**: Node.js, Express, SQLite3, Jest, Supertest
- **Testing Frontend**: Vitest, React Testing Library, Jest DOM
- **Estilos**: CSS puro con diseño moderno..sS

