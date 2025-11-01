#!/bin/bash

# Script para subir el proyecto a GitHub

if [ "$#" -lt 2 ]; then
    echo "📝 Uso: ./push-to-github.sh <usuario-github> <nombre-repo>"
    echo ""
    echo "Ejemplo:"
    echo "  ./push-to-github.sh facundograffigna pagina-tp5"
    echo ""
    exit 1
fi

USUARIO=$1
REPO=$2
URL="https://github.com/${USUARIO}/${REPO}.git"

echo "🚀 Subiendo proyecto a GitHub..."
echo ""
echo "Usuario: $USUARIO"
echo "Repo: $REPO"
echo "URL: $URL"
echo ""

# Verificar que existe .git
if [ ! -d ".git" ]; then
    echo "❌ No es un repositorio git. Ejecuta primero:"
    echo "   git init"
    echo "   ./setup-github.sh"
    exit 1
fi

# Cambiar a rama main
echo "📌 Configurando rama main..."
git branch -M main 2>/dev/null || echo "Ya estás en main"

# Verificar si existe el remote
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Ya existe un remote 'origin'"
    read -p "¿Reemplazarlo? (s/n): " reemplazar
    if [ "$reemplazar" = "s" ]; then
        git remote remove origin
        git remote add origin "$URL"
        echo "✅ Remote actualizado"
    fi
else
    git remote add origin "$URL"
    echo "✅ Remote agregado"
fi

# Verificar estado
echo ""
echo "📊 Archivos que se van a subir:"
git status --short

echo ""
read -p "¿Continuar con el push? (s/n): " continuar
if [ "$continuar" != "s" ]; then
    echo "❌ Cancelado"
    exit 1
fi

# Hacer push
echo ""
echo "⬆️  Subiendo a GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Proyecto subido exitosamente a GitHub!"
    echo ""
    echo "🔗 URL: $URL"
else
    echo ""
    echo "❌ Error al subir. Verifica:"
    echo "   1. Que el repositorio exista en GitHub"
    echo "   2. Que tengas permisos de escritura"
    echo "   3. Que las credenciales estén configuradas"
fi

