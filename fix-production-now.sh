#!/bin/bash

echo "🚨 CORRECTION PRODUCTION IMMÉDIATE"
echo "=================================="

# Arrêter l'app d'abord
echo "⏸️  Arrêt de l'application..."
docker stop logiflow-app

# Correction SQL directe
echo "🔧 Correction de la base de données..."
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
-- Ajouter les colonnes manquantes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrer les données si nécessaire
UPDATE deliveries SET scheduled_date = COALESCE(planned_date::DATE, CURRENT_DATE) WHERE scheduled_date IS NULL;

-- Vérifier les ajouts
SELECT 'VÉRIFICATION:' as status;
SELECT 
    table_name || '.' || column_name as column_added
FROM information_schema.columns 
WHERE (table_name = 'orders' AND column_name = 'notes')
   OR (table_name = 'deliveries' AND column_name IN ('scheduled_date', 'notes'));
"

# Nettoyer le cache de l'application (forcer rebuild)
echo "🏗️  Nettoyage du cache application..."
docker exec logiflow-app rm -rf /app/dist/ /app/node_modules/.cache/ 2>/dev/null || true

# Reconstruction forcée
echo "🔨 Reconstruction de l'application..."
docker exec logiflow-app npm run build

# Redémarrage
echo "🔄 Redémarrage..."
docker start logiflow-app

# Attendre le démarrage
echo "⏱️  Attente démarrage (20s)..."
sleep 20

# Test
echo "🧪 Test de l'API..."
curl -s http://localhost:3000/api/debug/status | head -1

echo ""
echo "✅ CORRECTION TERMINÉE"
echo "Testez maintenant la création de commande !"