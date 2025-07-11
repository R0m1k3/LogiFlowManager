#!/bin/bash

# SCRIPT DE RÉPARATION IMMÉDIATE
echo "🚨 RÉPARATION D'URGENCE LOGIFLOW"
echo "================================"

# Appliquer le fix SQL
echo "🔧 Application du correctif SQL..."
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db << 'EOF'
-- AJOUTER IMMÉDIATEMENT LES COLONNES MANQUANTES
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS notes TEXT;

-- MIGRER LES DONNÉES
UPDATE deliveries SET scheduled_date = COALESCE(planned_date::DATE, CURRENT_DATE) WHERE scheduled_date IS NULL;

-- VÉRIFIER
SELECT 'COLONNES AJOUTÉES:' as info;
SELECT table_name, column_name FROM information_schema.columns 
WHERE (table_name='orders' AND column_name='notes') 
   OR (table_name='deliveries' AND column_name IN ('scheduled_date','notes'));
EOF

# Redémarrer l'app
echo "🔄 Redémarrage de l'application..."
docker restart logiflow-app

echo "✅ RÉPARATION TERMINÉE"
echo "Testez maintenant la création de commandes !"