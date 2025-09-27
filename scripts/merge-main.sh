#!/bin/bash

echo "🔄 Обновление форка с main..."

# Включаем rerere для запоминания разрешений конфликтов
git config rerere.enabled true
git config rerere.autoupdate true

# Получаем последние изменения
git fetch origin

# Создаем список файлов локализации для автоматического разрешения
LOCALIZATION_PATTERN="(package\.nls\.|i18n/locales/)"

echo "📥 Выполняем merge с origin/main..."
git merge origin/main

# Проверяем, есть ли конфликты
if git diff --name-only --diff-filter=U | grep -q .; then
    echo "⚠️  Обнаружены конфликты, автоматически разрешаем файлы локализации..."
    
    # Автоматически разрешаем файлы локализации
    git diff --name-only --diff-filter=U | grep -E "$LOCALIZATION_PATTERN" > /tmp/localization_conflicts.txt
    
    if [ -s /tmp/localization_conflicts.txt ]; then
        echo "🔧 Автоматически разрешаем $(wc -l < /tmp/localization_conflicts.txt) файлов локализации..."
        
        while read file; do
            echo "  ✅ $file"
            # Берем версию из main для файлов локализации
            git show :3:"$file" > "$file" 2>/dev/null || echo "{}" > "$file"
            git add "$file"
        done < /tmp/localization_conflicts.txt
    fi
    
    # Показываем оставшиеся конфликты
    REMAINING=$(git diff --name-only --diff-filter=U)
    if [ -n "$REMAINING" ]; then
        echo ""
        echo "⚠️  Остались конфликты в следующих файлах:"
        echo "$REMAINING" | sed 's/^/  - /'
        echo ""
        echo "🔧 Разрешите их вручную в VSCode и выполните:"
        echo "   git add ."
        echo "   git commit -m 'Merge main into harvi'"
    else
        echo "✅ Все конфликты разрешены автоматически!"
        git commit -m "Merge main into harvi - auto-resolved localization conflicts"
    fi
else
    echo "✅ Merge выполнен без конфликтов!"
fi

echo "🎉 Готово!"