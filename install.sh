#!/usr/bin/env bash
set -e

REPO_OWNER="Gumballxnz"
REPO_NAME="clean-code"
REPO_URL="https://github.com/$REPO_OWNER/$REPO_NAME.git"
TARGET_DIR="$HOME/.gemini/config/skills/clean-code"

echo -e "\033[0;36m========================================================\033[0m"
echo -e "\033[1;33m   Instalador Oficial: Clean Code Skill (Antigravity)   \033[0m"
echo -e "\033[0;36m========================================================\033[0m"

if command -v git >/dev/null 2>&1; then
    echo -e "\033[0;37mGit detectado no sistema.\033[0m"
    if [ -d "$TARGET_DIR/.git" ]; then
        echo -e "\033[0;37mAtualizando instalacao existente via Git em:\033[0m"
        echo -e " -> $TARGET_DIR"
        (cd "$TARGET_DIR" && git pull origin main || true)
    else
        echo -e "\033[0;37mClonando repositorio oficial diretamente em:\033[0m"
        echo -e " -> $TARGET_DIR"
        rm -rf "$TARGET_DIR" 2>/dev/null || true
        git clone "$REPO_URL" "$TARGET_DIR"
    fi
else
    echo -e "\033[0;37mGit nao encontrado. Instalando via download direto...\033[0m"
    SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
    IS_REMOTE=false

    if [ ! -f "$SOURCE_DIR/SKILL.md" ]; then
        IS_REMOTE=true
        TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'clean-code-install')
        echo -e "\033[0;37mBaixando versao mais recente do repositorio $REPO_OWNER/$REPO_NAME...\033[0m"
        
        ZIP_URL="https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/main.tar.gz"
        curl -fsSL "$ZIP_URL" | tar -xz -C "$TEMP_DIR"
        SOURCE_DIR="$TEMP_DIR/clean-code-main"
    fi

    mkdir -p "$TARGET_DIR"
    cp -f "$SOURCE_DIR/SKILL.md" "$TARGET_DIR/" 2>/dev/null || true
    cp -f "$SOURCE_DIR/package.json" "$TARGET_DIR/" 2>/dev/null || true
    cp -f "$SOURCE_DIR/LICENSE" "$TARGET_DIR/" 2>/dev/null || true
    cp -f "$SOURCE_DIR/README.md" "$TARGET_DIR/" 2>/dev/null || true

    mkdir -p "$TARGET_DIR/scripts" "$TARGET_DIR/templates"
    cp -rf "$SOURCE_DIR/scripts/"* "$TARGET_DIR/scripts/"
    cp -rf "$SOURCE_DIR/templates/"* "$TARGET_DIR/templates/"

    if [ "$IS_REMOTE" = true ]; then
        rm -rf "$TEMP_DIR"
    fi
fi

echo -e "\n\033[0;37mInstalando / atualizando dependencias (TypeScript)...\033[0m"
(
    cd "$TARGET_DIR"
    npm install --omit=dev --silent || echo "Aviso: Nao foi possivel rodar 'npm install'. Certifique-se de que o Node.js esta instalado."
)

echo -e "\n\033[0;32m========================================================\033[0m"
echo -e "\033[0;32m [OK] Clean Code Skill instalada e atualizada com sucesso!\033[0m"
echo -e "\033[0;32m========================================================\033[0m"
echo -e "\033[1;33mComo usar:\033[0m"
echo -e " 1. No chat do Antigravity, basta digitar:"
echo -e "    \033[0;36m/clean-code\033[0m"
echo -e " 2. Para atualizar a qualquer momento:"
echo -e "    \033[0;36mnode \"$TARGET_DIR/scripts/clean_code.js\" --update\033[0m"
echo -e " 3. Para ativar pre-commit hook automatico em qualquer projeto:"
echo -e "    \033[0;36mnode \"$TARGET_DIR/scripts/clean_code.js\" --hook\033[0m"
echo -e "\033[0;32m========================================================\033[0m\n"
