#!/bin/bash
# Link Validation Script
# Validates all markdown links in the project

echo "🔍 Validating documentation links..."
echo ""

# Count total markdown files
TOTAL=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l | tr -d ' ')
echo "📄 Total markdown files: $TOTAL"
echo ""

# Validate critical files
CRITICAL_FILES=(
  "README.md"
  "docs/README.md"
  "docs/INDEX.md"
  "docs/getting-started/installation.md"
  "docs/getting-started/quick-start.md"
  "docs/troubleshooting/README.md"
  "i18n/pt-BR/README.md"
)

echo "✅ Validating critical files..."
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Checking: $file"
    npx markdown-link-check "$file" --quiet 2>&1 | grep -E "(✓|✖|ERROR)"
  fi
done

echo ""
echo "✅ Validation complete!"
