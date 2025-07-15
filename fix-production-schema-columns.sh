#!/bin/bash

echo "=== CORRECTION COLONNES MANQUANTES PRODUCTION ==="
echo "Date: $(date)"
echo ""

echo "🔧 Correction des colonnes manquantes dans storage.production.ts :"

# Backup du fichier original
cp server/storage.production.ts server/storage.production.ts.backup

# Corrections des colonnes manquantes
echo "1. Correction p.display_name -> p.name"
sed -i "s/p\.display_name/p.name/g" server/storage.production.ts

echo "2. Correction p.action -> p.name (action)"
sed -i "s/'action', p\.action,/'action', p.name,/g" server/storage.production.ts

echo "3. Correction p.resource -> 'system'"
sed -i "s/'resource', p\.resource,/'resource', 'system',/g" server/storage.production.ts

echo "4. Correction p.is_system -> true"
sed -i "s/'isSystem', p\.is_system,/'isSystem', true,/g" server/storage.production.ts

echo "5. Correction GROUP BY sans colonnes inexistantes"
sed -i "s/GROUP BY r\.id, r\.name, r\.display_name, r\.description, r\.color, r\.is_system, r\.is_active, r\.created_at, r\.updated_at/GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at/g" server/storage.production.ts

echo "6. Correction row.display_name -> row.name"
sed -i "s/row\.display_name || row\.name/row.name/g" server/storage.production.ts

echo "7. Suppression des colonnes inexistantes dans INSERT"
sed -i "s/INSERT INTO roles (name, display_name, description, color, is_system, is_active, created_at, updated_at)/INSERT INTO roles (name, description, created_at, updated_at)/g" server/storage.production.ts

echo "8. Correction VALUES correspondants"
sed -i "s/VALUES (\$1, \$2, \$3, \$4, \$5, \$6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)/VALUES (\$1, \$2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)/g" server/storage.production.ts

echo "9. Correction paramètres createRole"
sed -i "s/roleData\.displayName,/\/\/ roleData.displayName,/g" server/storage.production.ts
sed -i "s/roleData\.color,/\/\/ roleData.color,/g" server/storage.production.ts
sed -i "s/roleData\.isSystem || false,/\/\/ roleData.isSystem || false,/g" server/storage.production.ts
sed -i "s/roleData\.isActive !== false/\/\/ roleData.isActive !== false/g" server/storage.production.ts

echo ""
echo "✅ Corrections terminées !"
echo ""

echo "🧪 Test de la correction :"
if grep -q "p.display_name" server/storage.production.ts; then
  echo "❌ Encore des références à p.display_name"
else
  echo "✅ Plus de références à p.display_name"
fi

if grep -q "p.action" server/storage.production.ts; then
  echo "❌ Encore des références à p.action"
else
  echo "✅ Plus de références à p.action"
fi

echo ""
echo "📁 Fichier de sauvegarde : server/storage.production.ts.backup"
echo "📁 Fichier corrigé : server/storage.production.ts"
echo ""
echo "🚀 Redémarrez maintenant l'application pour tester !"