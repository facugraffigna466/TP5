#!/bin/bash

# Script mejorado para visualizar la base de datos SQLite

DB_PATH="database.sqlite"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Base de datos no encontrada: $DB_PATH"
    echo "💡 Inicia el servidor primero con 'npm start'"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VISUALIZACIÓN DE BASE DE DATOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🏗️  ESTRUCTURA DE LA TABLA 'tareas':"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" ".schema tareas"
echo ""

echo "📝 REGISTROS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 -header -column -line "$DB_PATH" "SELECT * FROM tareas ORDER BY fecha_creacion DESC;"
echo ""

echo "📈 ESTADÍSTICAS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas;")
PENDIENTES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas WHERE completada = 0;")
COMPLETADAS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas WHERE completada = 1;")

echo "   📊 Total: $TOTAL"
echo "   ⏳ Pendientes: $PENDIENTES"
echo "   ✅ Completadas: $COMPLETADAS"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


