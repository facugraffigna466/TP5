#!/bin/bash

# Script para configurar y subir el proyecto a GitHub

echo "🚀 Configurando proyecto para GitHub..."
echo ""

# Verificar si ya es un repo git
if [ -d ".git" ]; then
    echo "⚠️  Ya existe un repositorio git en este directorio"
    read -p "¿Continuar de todos modos? (s/n): " continuar
    if [ "$continuar" != "s" ]; then
        echo "❌ Cancelado"
        exit 1
    fi
fi

# Inicializar git si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio git..."
    git init
    echo "✅ Repositorio inicializado"
fi

# Verificar estado
echo ""
echo "📊 Estado actual del repositorio:"
git status --short

echo ""
read -p "¿Agregar todos los archivos? (s/n): " agregar
if [ "$agregar" = "s" ]; then
    git add .
    echo "✅ Archivos agregados"
fi

echo ""
read -p "¿Hacer commit inicial? (s/n): " commit
if [ "$commit" = "s" ]; then
    read -p "Mensaje del commit (Enter para usar 'Initial commit'): " mensaje
    mensaje=${mensaje:-"Initial commit"}
    git commit -m "$mensaje"
    echo "✅ Commit realizado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PRÓXIMOS PASOS MANUALES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Crea un nuevo repositorio en GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. NO inicialices el repo con README, .gitignore o licencia"
echo "   (ya tenemos esos archivos)"
echo ""
echo "3. Copia la URL de tu repositorio (ej: https://github.com/usuario/repo.git)"
echo ""
echo "4. Ejecuta estos comandos:"
echo ""
echo "   git branch -M main"
echo "   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git"
echo "   git push -u origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 O usa este script completo después de crear el repo en GitHub:"
echo "   ./push-to-github.sh TU-USUARIO TU-REPO"
echo ""

