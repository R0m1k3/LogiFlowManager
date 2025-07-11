#!/bin/bash
# Correction URGENTE contrainte deliveries_status_check en production

echo "🔧 CORRECTION CONTRAINTE PRODUCTION"
echo "===================================="

# Variables Docker
CONTAINER="logiflow-postgres"
DB_USER="logiflow_admin"
DB_NAME="logiflow_db"

echo "📋 1. Diagnostic actuel..."
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'deliveries'::regclass AND contype = 'c' AND conname LIKE '%status%';
"

echo "🛠️  2. Suppression contrainte problématique..."
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
"

echo "✅ 3. Recréation contrainte correcte..."
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check_fixed 
CHECK (status IN ('planned', 'delivered'));
"

echo "🧪 4. Test insertion..."
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "
INSERT INTO deliveries (supplier_id, group_id, scheduled_date, quantity, unit, status, created_by, created_at, updated_at)
VALUES (1, 1, '2025-07-15', 1, 'palettes', 'planned', 'admin_local', NOW(), NOW())
RETURNING id;
"

echo "🧹 5. Nettoyage test..."
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "
DELETE FROM deliveries WHERE created_at >= '2025-07-15';
"

echo "🔄 6. Redémarrage application..."
docker restart logiflow-app

echo "===================================="
echo "✅ CORRECTION TERMINÉE"
echo "Testez maintenant la création de livraison"
echo "===================================="