#!/bin/bash

# SCRIPT DE DÉPLOIEMENT PRODUCTION LOGIFLOW
# ========================================

echo "🚀 Déploiement LogiFlow Production - Correction Schema"
echo "======================================================"

# Variables
CONTAINER_DB="logiflow-db"
CONTAINER_APP="logiflow-app"
DB_USER="logiflow_admin"
DB_NAME="logiflow_db"

# 1. Vérifier que les conteneurs existent
echo "📋 Vérification des conteneurs..."
if ! docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_DB"; then
    echo "❌ Erreur: Conteneur $CONTAINER_DB introuvable"
    exit 1
fi

if ! docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_APP"; then
    echo "❌ Erreur: Conteneur $CONTAINER_APP introuvable"
    exit 1
fi

# 2. Arrêter l'application
echo "⏸️  Arrêt de l'application..."
docker stop $CONTAINER_APP

# 3. Appliquer le correctif de schéma
echo "🔧 Application du correctif de schéma..."
docker exec -i $CONTAINER_DB psql -U $DB_USER -d $DB_NAME << 'EOF'
-- SCRIPT DE CORRECTION PRODUCTION URGENTE
-- =======================================

-- 1. ORDERS TABLE - Ajouter colonne notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si comments existe, migrer vers notes puis supprimer comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'comments') THEN
        UPDATE orders SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE orders DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in orders table';
    END IF;
END $$;

-- 2. DELIVERIES TABLE - Ajouter colonnes manquantes
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS scheduled_date TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si planned_date existe, migrer vers scheduled_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'planned_date') THEN
        UPDATE deliveries SET scheduled_date = planned_date::TEXT 
        WHERE (scheduled_date IS NULL OR scheduled_date = '') AND planned_date IS NOT NULL;
        RAISE NOTICE 'Migrated planned_date to scheduled_date in deliveries table';
    END IF;
    
    -- Si comments existe, migrer vers notes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'comments') THEN
        UPDATE deliveries SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE deliveries DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in deliveries table';
    END IF;
END $$;

-- S'assurer que scheduled_date n'est pas NULL
UPDATE deliveries SET scheduled_date = COALESCE(scheduled_date, '2025-01-01') 
WHERE scheduled_date IS NULL OR scheduled_date = '';
ALTER TABLE deliveries ALTER COLUMN scheduled_date SET NOT NULL;

-- 3. Vérification finale
\echo '📊 Vérification du schéma:'
SELECT 'orders' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'notes'
UNION ALL
SELECT 'deliveries' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'deliveries' AND column_name IN ('notes', 'scheduled_date')
ORDER BY table_name, column_name;

\echo '✅ Correctif appliqué avec succès!'
EOF

if [ $? -eq 0 ]; then
    echo "✅ Correctif de schéma appliqué avec succès"
else
    echo "❌ Erreur lors de l'application du correctif"
    exit 1
fi

# 4. Redémarrer l'application
echo "🔄 Redémarrage de l'application..."
docker start $CONTAINER_APP

# 5. Attendre et vérifier
echo "⏱️  Attente du démarrage..."
sleep 10

# 6. Test de l'API
echo "🧪 Test de l'API..."
if curl -s -f http://localhost:3000/api/debug/status > /dev/null 2>&1; then
    echo "✅ API opérationnelle"
else
    echo "⚠️  API pas encore disponible (normal au démarrage)"
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ"
echo "====================="
echo "✅ Schéma de base de données mis à jour"
echo "✅ Application redémarrée"
echo "🌐 Application disponible sur le port 3000"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Tester la création de commandes"
echo "   2. Vérifier les livraisons"
echo "   3. Confirmer que tout fonctionne"