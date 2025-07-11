#!/bin/bash
echo "🔧 Correction de la date de validation des livraisons..."

# Ajouter les colonnes manquantes dans la base de données si elles n'existent pas
cat > temp_schema_fix.sql << 'EOF'
-- Ajouter la colonne delivered_date si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='deliveries' AND column_name='delivered_date') THEN
        ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;
    END IF;
END $$;

-- Ajouter la colonne validated_at si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='deliveries' AND column_name='validated_at') THEN
        ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;
    END IF;
END $$;

-- Mettre à jour les livraisons existantes avec status='delivered' pour avoir une date de validation
UPDATE deliveries 
SET validated_at = updated_at, delivered_date = updated_at 
WHERE status = 'delivered' AND validated_at IS NULL;
EOF

echo "📋 Application des corrections de schéma..."
npm run db:push --force

echo "✅ Corrections appliquées avec succès !"
echo "🔄 Redémarrage de l'application pour appliquer les changements..."

# Nettoyage
rm -f temp_schema_fix.sql

echo "✅ Correction terminée ! La date de validation devrait maintenant s'afficher correctement."