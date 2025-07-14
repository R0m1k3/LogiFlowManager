#!/bin/bash

echo "🚨 CORRECTION URGENTE PRODUCTION - COLONNES MANQUANTES ORDERS"
echo "============================================================="
echo ""

echo "PROBLÈME IDENTIFIÉ :"
echo "❌ Colonne 'quantity' manquante dans table 'orders' en production"
echo "❌ Colonne 'unit' manquante dans table 'orders' en production"
echo ""

echo "SOLUTION SQL DIRECTE :"
echo "----------------------"

cat << 'EOF'
-- SQL à exécuter en production pour corriger immédiatement

-- 1. Ajouter colonne quantity dans orders si manquante
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'quantity') THEN
        ALTER TABLE orders ADD COLUMN quantity INTEGER;
        RAISE NOTICE 'Colonne quantity ajoutée à orders';
    ELSE
        RAISE NOTICE 'Colonne quantity existe déjà dans orders';
    END IF;
END $$;

-- 2. Ajouter colonne unit dans orders si manquante  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'unit') THEN
        ALTER TABLE orders ADD COLUMN unit VARCHAR(50);
        RAISE NOTICE 'Colonne unit ajoutée à orders';
    ELSE
        RAISE NOTICE 'Colonne unit existe déjà dans orders';
    END IF;
END $$;

-- 3. Vérification finale
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('quantity', 'unit')
ORDER BY column_name;
EOF

echo ""
echo "POUR APPLIQUER EN PRODUCTION :"
echo "1. Connectez-vous à votre base PostgreSQL"
echo "2. Exécutez le SQL ci-dessus"
echo "3. OU utilisez la migration mise à jour : psql < migration-production.sql"
echo ""
echo "ALTERNATIVE RAPIDE :"
echo "Redémarrez le conteneur Docker après avoir mis à jour migration-production.sql"
echo ""
echo "✅ migration-production.sql mis à jour avec la correction"
echo ""