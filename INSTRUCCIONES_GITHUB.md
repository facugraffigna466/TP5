# 📤 Guía para Subir a GitHub

## ✅ Checklist Antes de Subir

- [x] ✅ `.gitignore` configurado correctamente
- [x] ✅ Scripts de ayuda creados
- [x] ✅ Archivos sensibles excluidos (database.sqlite, node_modules)

## 🚀 Pasos para Subir a GitHub

### Opción 1: Script Automático (Recomendado)

```bash
# 1. Ejecutar script de setup
./setup-github.sh

# 2. Crear el repositorio en GitHub (ve a https://github.com/new)
#    - NO marques "Initialize with README"
#    - NO agregues .gitignore ni licencia

# 3. Una vez creado, ejecuta:
./push-to-github.sh TU-USUARIO-GITHUB NOMBRE-DEL-REPO

# Ejemplo:
./push-to-github.sh facundograffigna pagina-tp5
```

### Opción 2: Manual (Paso a Paso)

#### Paso 1: Inicializar Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Initial commit: Aplicación de gestión de tareas"
```

#### Paso 2: Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. **Nombre del repositorio:** Ej: `pagina-tp5`
3. **Descripción:** "Aplicación de gestión de tareas con React, Node.js y SQLite"
4. **Visibilidad:** Público o Privado (tu elección)
5. **NO marques:**
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Click en **"Create repository"**

#### Paso 3: Conectar y Subir

```bash
# Cambiar a rama main (si es necesario)
git branch -M main

# Agregar el remote (reemplaza con TU URL)
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git

# Verificar que se agregó correctamente
git remote -v

# Subir el código
git push -u origin main
```

## 📋 Información que Necesitas

Para subir necesitas:
1. **Usuario de GitHub:** Tu nombre de usuario
2. **Nombre del repositorio:** El que quieras darle (ej: `pagina-tp5`)

## ⚠️ Archivos que NO se Suben (gracias a .gitignore)

- ✅ `node_modules/` - Dependencias (se reinstalan con npm install)
- ✅ `database.sqlite` - Base de datos local
- ✅ `.env` - Variables de entorno
- ✅ `*.log` - Archivos de log
- ✅ Archivos del sistema (`.DS_Store`, etc.)

## 🔐 Si Te Pide Credenciales

Si GitHub te pide usuario y contraseña:

### Opción A: Usar Personal Access Token (Recomendado)

1. Ve a: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token"
3. Selecciona scope: `repo`
4. Copia el token generado
5. Cuando git pida contraseña, usa el token en lugar de tu contraseña

### Opción B: Configurar SSH (Avanzado)

```bash
# Generar clave SSH (si no tienes)
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Agregar clave a ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub
# Pegar en GitHub → Settings → SSH and GPG keys

# Usar URL SSH en lugar de HTTPS:
git remote set-url origin git@github.com:USUARIO/REPO.git
```

## ✅ Verificar que se Subió Correctamente

Después de hacer push:

1. Ve a tu repositorio en GitHub: `https://github.com/TU-USUARIO/TU-REPO`
2. Deberías ver todos los archivos
3. Verifica que NO esté `database.sqlite` ni `node_modules`

## 📝 Archivos Importantes que SÍ se Suben

- ✅ Todo el código fuente (`*.js`, `*.jsx`, `*.css`)
- ✅ `package.json` (para que otros puedan instalar dependencias)
- ✅ `README.md`
- ✅ Archivos de configuración
- ✅ Scripts y guías

## 🔄 Actualizar el Repositorio (Después del Primer Push)

Si haces cambios y quieres subirlos:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

## 🆘 Solución de Problemas

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USUARIO/REPO.git
```

### Error: "failed to push some refs"
```bash
# Hacer pull primero (si hay cambios en GitHub)
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "Permission denied"
- Verifica que tengas acceso de escritura al repositorio
- Usa Personal Access Token en lugar de contraseña
- Verifica que el URL sea correcto

## 📚 Comandos Útiles

```bash
# Ver estado
git status

# Ver qué archivos se van a subir
git status --short

# Ver histórico de commits
git log --oneline

# Ver remotes configurados
git remote -v

# Cambiar URL del remote
git remote set-url origin NUEVA-URL
```

---

**¿Listo?** Ejecuta `./setup-github.sh` para empezar! 🚀

