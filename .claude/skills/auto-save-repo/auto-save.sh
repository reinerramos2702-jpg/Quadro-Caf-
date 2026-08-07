#!/bin/bash

# AUTO-SAVE-REPO Protocol
# Garantiza que TODOS los archivos se guarden en GitHub

set -e

if [ -f ~/.env.claude ]; then
    export $(cat ~/.env.claude | grep -v '^#' | xargs)
fi

COMMIT_PREFIX="[AUTO-SAVE]"

init_repo() {
    echo "🔄 Inicializando AUTO-SAVE-REPO..."
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ No estás en un repositorio Git"
        return 1
    fi
    git fetch origin main 2>/dev/null || true
    mkdir -p src/assets/fonts
    mkdir -p public/models
    mkdir -p src/assets/icons
    mkdir -p src/assets/svg
    mkdir -p src/assets/branding
    echo "✅ Repositorio listo para AUTO-SAVE"
}

save_file() {
    local file=$1
    local message=${2:-"Auto-save: $file"}
    if [ ! -f "$file" ]; then
        echo "❌ Archivo no encontrado: $file"
        return 1
    fi
    echo "💾 Guardando: $file"
    git add "$file"
    git commit -m "$COMMIT_PREFIX $message" 2>/dev/null || echo "⚠️  Sin cambios en $file"
    git push origin main
    echo "✅ $file guardado en GitHub"
}

save_batch() {
    local pattern=$1
    local message=${2:-"Auto-save batch"}
    echo "📦 Guardando lote: $pattern"
    git add $pattern
    git commit -m "$COMMIT_PREFIX $message (batch)" || echo "⚠️  Sin cambios"
    git push origin main
}

final_commit() {
    local message=$1
    echo "🎯 Finalizando sesión..."
    git add -A
    if ! git diff --cached --quiet; then
        git commit -m "$COMMIT_PREFIX [SESSION END] $message"
        git push origin main
        echo "✅ Sesión guardada: $message"
    else
        echo "✅ Sin cambios pendientes"
    fi
}

check_unsaved() {
    echo "🔍 Verificando archivos sin guardar..."
    if git status --porcelain | grep -E "^\?\?|^ M|^M"; then
        echo "⚠️  Archivos sin guardar encontrados"
        return 1
    else
        echo "✅ Todo guardado"
        return 0
    fi
}

create_release() {
    local version=$1
    local description=${2:-"Release $version"}
    echo "🚀 Creando Release para clientes: $version"
    git tag -a "$version" -m "$description"
    git push origin "$version"
    echo "✅ Release $version disponible para clientes"
}

show_help() {
    cat << EOF
AUTO-SAVE-REPO - Protocolo de guardado automático

Comandos disponibles:
  init_repo              Inicializar al inicio de sesión
  save_file "path"       Guardar archivo específico
  save_batch "pattern"   Guardar múltiples archivos
  final_commit "msg"     Commit final de sesión
  check_unsaved          Verificar archivos sin guardar
  create_release "v1.0"  Crear release para clientes
  show_help              Mostrar esta ayuda
EOF
}

if [ $# -eq 0 ]; then
    show_help
fi
