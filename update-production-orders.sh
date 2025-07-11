#!/bin/bash

# Script de vérification et debug des livraisons en production
# Affiche les statuts et données des livraisons pour diagnostiquer le dashboard

echo "🔍 DEBUG LIVRAISONS PRODUCTION - LogiFlow"
echo "========================================="

# Configuration Docker
CONTAINER_NAME="logiflow-app"

echo "📅 $(date) - Début debug livraisons"

# 1. Vérifier que le conteneur est en cours d'exécution
echo "🔍 Vérification du conteneur..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé"
    exit 1
fi

echo "✅ Conteneur trouvé"

# 2. Récupérer les informations de livraisons
echo "📊 Récupération des données de livraisons..."
docker exec $CONTAINER_NAME bash -c "
export PGPASSWORD=LogiFlow2025!

echo '=== LIVRAISONS EN BASE DE DONNÉES ==='
psql -h postgres -U logiflow_admin -d logiflow_db -c \"
SELECT 
  id, 
  scheduled_date, 
  status, 
  quantity, 
  unit,
  supplier_id,
  group_id,
  created_at::date
FROM deliveries 
ORDER BY scheduled_date;
\"

echo ''
echo '=== STATUTS DES LIVRAISONS ==='
psql -h postgres -U logiflow_admin -d logiflow_db -c \"
SELECT 
  status, 
  COUNT(*) as count,
  string_agg(id::text, ', ') as ids
FROM deliveries 
GROUP BY status 
ORDER BY status;
\"

echo ''
echo '=== LIVRAISONS FUTURES (planned) ==='
psql -h postgres -U logiflow_admin -d logiflow_db -c \"
SELECT 
  d.id, 
  d.scheduled_date, 
  d.status, 
  d.quantity, 
  d.unit,
  s.name as supplier_name,
  g.name as group_name
FROM deliveries d
JOIN suppliers s ON d.supplier_id = s.id
JOIN groups g ON d.group_id = g.id
WHERE d.status = 'planned'
AND d.scheduled_date >= CURRENT_DATE
ORDER BY d.scheduled_date;
\"
"

if [ $? -eq 0 ]; then
    echo "✅ Informations récupérées"
else
    echo "❌ Erreur lors de la récupération"
    exit 1
fi

# 3. Test API directe
echo ""
echo "🧪 Test API /api/deliveries..."
API_RESPONSE=$(docker exec $CONTAINER_NAME curl -s http://localhost:3000/api/deliveries)

if [ $? -eq 0 ]; then
    echo "✅ API répond"
    echo "Premier élément API (premiers 500 caractères):"
    echo "$API_RESPONSE" | head -c 500
    echo "..."
else
    echo "❌ Erreur API"
fi

echo ""
echo "========================================="
echo "🎉 DEBUG LIVRAISONS TERMINÉ"
echo "========================================="
echo "📅 $(date)"
echo ""
echo "ℹ️  Si le statut des livraisons n'est pas 'planned',"
echo "   elles n'apparaîtront pas dans 'Livraisons à Venir'"
echo "   dans le dashboard."
echo "========================================="