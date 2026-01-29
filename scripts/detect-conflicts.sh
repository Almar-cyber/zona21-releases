#!/bin/bash

# Script de Detecção de Conflitos entre Agentes
# Este script monitora mudanças no repositório e detecta possíveis conflitos

set -e

SUPERVISOR_LOG="docs/SUPERVISOR_LOG.md"
AGENTS_DIR="docs/agents"

echo "🔍 Iniciando detecção de conflitos..."

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Mudanças não commitadas detectadas:"
    git status -s
    echo ""
fi

# Verificar conflitos de merge
if [[ -n $(git ls-files -u) ]]; then
    echo "❌ CONFLITOS DE MERGE DETECTADOS:"
    git ls-files -u
    echo ""
    echo "Por favor, resolva os conflitos antes de continuar."
    exit 1
fi

# Verificar se múltiplos agentes modificaram os mesmos arquivos
echo "📊 Analisando histórico recente..."
git log --pretty=format:"%h|%an|%ar|%s" --since="1 hour ago" | while IFS='|' read -r hash author date message; do
    echo "  Commit: $hash"
    echo "  Autor: $author"
    echo "  Data: $date"
    echo "  Mensagem: $message"
    echo ""
done

# Verificar arquivos modificados recentemente por diferentes autores
echo "🔄 Verificando arquivos com múltiplas modificações..."
git log --pretty=format:"%H" --since="1 hour ago" | while read commit; do
    git diff-tree --no-commit-id --name-only -r $commit
done | sort | uniq -c | sort -rn | while read count file; do
    if [[ $count -gt 1 ]]; then
        echo "  ⚠️  Arquivo modificado $count vezes: $file"
    fi
done

echo ""
echo "✅ Análise de conflitos concluída!"
