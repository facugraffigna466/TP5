#!/bin/bash

# Script para visualizar la base de datos SQLite

DB_PATH="database.sqlite"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Base de datos no encontrada: $DB_PATH"
    echo "💡 Inicia el servidor primero con 'npm start'"
    exit 1
fi

echo "📊 Base de Datos: $DB_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Tablas en la base de datos:"
sqlite3 "$DB_PATH" ".tables"
echo ""

echo "🏗️  Estructura de la tabla 'tareas':"
sqlite3 "$DB_PATH" ".schema tareas"
echo ""

echo "📝 Registros en la tabla 'tareas':"
sqlite3 -header -column "$DB_PATH" "SELECT * FROM tareas ORDER BY fecha_creacion DESC;"
echo ""

echo "📈 Estadísticas:"
TOTAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas;")
PENDIENTES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas WHERE completada = 0;")
COMPLETADAS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tareas WHERE completada = 1;")

echo "   Total: $TOTAL"
echo "   Pendientes: $PENDIENTES"
echo "   Completadas: $COMPLETADAS"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Para ver la base de datos de forma interactiva:"
echo "   sqlite3 $DB_PATH"
echo ""
echo "💡 Comandos útiles de sqlite3:"
echo "   .tables              - Ver todas las tablas"
echo "   .schema tareas       - Ver estructura de la tabla"
echo "   SELECT * FROM tareas; - Ver todos los registros"
echo "   .quit                - Salir"


