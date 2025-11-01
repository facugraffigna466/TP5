# Guía de Solución de Problemas

## Errores Comunes y Soluciones

### 1. Error: "Cannot find module" o "Module not found"

**Causa**: Las dependencias no están instaladas.

**Solución**:
```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Error: "Port 3001 is already in use" o "EADDRINUSE"

**Causa**: El puerto está siendo usado por otro proceso.

**Solución**:
```bash
# En macOS/Linux, encontrar y matar el proceso:
lsof -ti:3001 | xargs kill -9

# O cambiar el puerto en backend/server.js:
const PORT = process.env.PORT || 3002
```

### 3. Error: "Cannot GET /" en el navegador

**Causa**: El frontend no está corriendo o el proxy no está configurado.

**Solución**:
- Asegúrate de que el frontend esté corriendo: `cd frontend && npm run dev`
- Verifica que el backend esté corriendo en el puerto 3001
- Asegúrate de acceder a `http://localhost:3000` (no 3001)

### 4. Error: "Network Error" o "Failed to fetch" en el frontend

**Causa**: El backend no está corriendo o CORS está bloqueando.

**Solución**:
- Verifica que el backend esté corriendo: `cd backend && npm start`
- Revisa que el puerto sea 3001 (o el configurado)
- Verifica la consola del navegador para más detalles

### 5. Error: "sqlite3 is not defined" o problemas con la base de datos

**Causa**: SQLite3 no está instalado correctamente.

**Solución**:
```bash
cd backend
rm -rf node_modules
npm install
```

### 6. La base de datos no se crea

**Causa**: Permisos de escritura o ruta incorrecta.

**Solución**:
- Verifica que el directorio `backend` tenga permisos de escritura
- La base de datos se crea automáticamente al iniciar el servidor
- Busca `database.sqlite` en la carpeta `backend`

### 7. Error en el navegador: "Uncaught SyntaxError" o errores de módulos

**Causa**: Problemas con Vite o dependencias no instaladas.

**Solución**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 8. Los cambios no se reflejan en el frontend

**Causa**: Caché del navegador o Vite no está recargando.

**Solución**:
- Recarga la página con Ctrl+Shift+R (o Cmd+Shift+R en Mac)
- Verifica que Vite esté en modo desarrollo: `npm run dev`
- Revisa la consola del navegador para errores

## Verificar que todo funciona

### 1. Verificar Backend:
```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3001
📊 Base de datos: /ruta/a/database.sqlite
```

### 2. Verificar Health Check:
```bash
curl http://localhost:3001/health
```

Debería devolver: `{"status":"ok","message":"Servidor funcionando correctamente"}`

### 3. Verificar Frontend:
```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### 4. Probar API desde el navegador:
Abre `http://localhost:3000` y verifica que:
- Se cargue la interfaz
- Puedas agregar una tarea
- Las tareas aparezcan en la lista

## Comandos útiles para debug

```bash
# Ver procesos en puertos específicos
lsof -i :3000
lsof -i :3001

# Ver logs del backend en tiempo real
cd backend && npm start

# Ver logs del frontend
cd frontend && npm run dev

# Limpiar e instalar todo desde cero
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## Si nada funciona

1. Verifica que Node.js esté instalado: `node --version` (debe ser 14+)
2. Verifica que npm esté instalado: `npm --version`
3. Lee los mensajes de error completos en la terminal
4. Revisa la consola del navegador (F12) para errores del frontend


