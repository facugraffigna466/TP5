#!/bin/bash

# Script interactivo para aprender SQLite

DB_PATH="database.sqlite"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 TUTORIAL INTERACTIVO DE SQLITE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Este script te enseñará cómo funciona SQLite paso a paso."
echo ""
read -p "Presiona Enter para comenzar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 1: ¿Qué es SQLite?"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SQLite es una base de datos que se guarda en UN SOLO ARCHIVO."
echo "Tu base de datos está en: $(pwd)/$DB_PATH"
echo ""
echo "Vamos a verificar que existe..."
if [ -f "$DB_PATH" ]; then
    echo "✅ Archivo encontrado: $(ls -lh "$DB_PATH" | awk '{print $5}')"
else
    echo "❌ Archivo no encontrado. Ejecuta 'npm start' primero."
    exit 1
fi
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 2: Ver la estructura (schema)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Primero veamos cómo está estructurada tu tabla:"
echo ""
sqlite3 "$DB_PATH" ".schema tareas"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 3: Ver los datos (SELECT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ahora veamos qué datos tienes:"
echo ""
sqlite3 -header -column "$DB_PATH" "SELECT * FROM tareas;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 4: Crear datos (INSERT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Vamos a crear una tarea nueva desde SQL:"
echo ""
TITULO="Aprender SQLite desde la terminal"
DESC="Ejemplo de cómo se crean datos en SQLite"
sqlite3 "$DB_PATH" "INSERT INTO tareas (titulo, descripcion) VALUES ('$TITULO', '$DESC');"
echo "✅ Tarea creada!"
echo ""
echo "Veamos las tareas actualizadas:"
sqlite3 -header -column "$DB_PATH" "SELECT * FROM tareas ORDER BY id DESC LIMIT 3;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 5: Actualizar datos (UPDATE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Vamos a marcar la última tarea como completada:"
echo ""
ULTIMO_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM tareas ORDER BY id DESC LIMIT 1;")
sqlite3 "$DB_PATH" "UPDATE tareas SET completada = 1 WHERE id = $ULTIMO_ID;"
echo "✅ Tarea $ULTIMO_ID marcada como completada!"
echo ""
echo "Verifiquemos:"
sqlite3 -header -column "$DB_PATH" "SELECT id, titulo, completada FROM tareas WHERE id = $ULTIMO_ID;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 6: Consultas con filtros (WHERE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Solo tareas pendientes:"
sqlite3 -header -column "$DB_PATH" "SELECT id, titulo FROM tareas WHERE completada = 0;"
echo ""
echo "Solo tareas completadas:"
sqlite3 -header -column "$DB_PATH" "SELECT id, titulo FROM tareas WHERE completada = 1;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 7: Estadísticas (COUNT, SUM)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sqlite3 "$DB_PATH" "SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN completada = 0 THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completadas
FROM tareas;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 8: Eliminar datos (DELETE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  NOTA: No vamos a eliminar nada realmente en este tutorial."
echo "    Pero aquí tienes ejemplos de cómo hacerlo:"
echo ""
echo "Ejemplo 1 - Eliminar una tarea específica:"
echo "  DELETE FROM tareas WHERE id = 1;"
echo ""
echo "Ejemplo 2 - Eliminar tareas completadas:"
echo "  DELETE FROM tareas WHERE completada = 1;"
echo ""
read -p "Presiona Enter para continuar..."

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 RESUMEN - Comandos SQL Básicos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 CREAR (INSERT):"
echo "   INSERT INTO tareas (titulo, descripcion) VALUES ('Título', 'Desc');"
echo ""
echo "👁️  LEER (SELECT):"
echo "   SELECT * FROM tareas;"
echo "   SELECT * FROM tareas WHERE completada = 0;"
echo ""
echo "✏️  ACTUALIZAR (UPDATE):"
echo "   UPDATE tareas SET completada = 1 WHERE id = 1;"
echo ""
echo "🗑️  ELIMINAR (DELETE):"
echo "   DELETE FROM tareas WHERE id = 1;"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 CÓMO USAR SQLITE INTERACTIVAMENTE:"
echo ""
echo "   1. cd backend"
echo "   2. sqlite3 database.sqlite"
echo "   3. Escribe comandos SQL"
echo "   4. .quit para salir"
echo ""
echo "📚 MÁS INFORMACIÓN:"
echo "   - Lee GUIA_SQLITE.md para detalles completos"
echo "   - Mira ejemplos-sqlite.sql para más ejemplos"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tutorial completado!"
echo ""


