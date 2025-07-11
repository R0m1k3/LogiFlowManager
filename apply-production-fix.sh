#!/bin/bash

# Script de correction urgente pour la production
# Corrige le problème de contrainte deliveries_status_check

echo "🔧 CORRECTION URGENTE PRODUCTION - Deliveries Schema"
echo "=================================================="

# Connexion à la base Docker
CONTAINER_NAME="logiflow-postgres"
DB_NAME="logiflow_db"
DB_USER="logiflow_admin"

echo "📋 Étape 1: Sauvegarde de sécurité..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > backup_before_fix_$(date +%Y%m%d_%H%M%S).sql

echo "🔍 Étape 2: Diagnostic du problème..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY ordinal_position;
"

echo "🛠️  Étape 3: Application du correctif..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < fix-production-deliveries.sql

echo "✅ Étape 4: Vérification..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'deliveries'::regclass AND contype = 'c';
"

echo "🔄 Étape 5: Redémarrage application..."
docker restart logiflow-app

echo "=================================================="
echo "✅ CORRECTION TERMINÉE"
echo "Testez maintenant la création de livraison"
echo "=================================================="