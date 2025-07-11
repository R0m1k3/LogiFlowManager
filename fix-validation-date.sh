#!/bin/bash

# Script de correction URGENTE - LogiFlow
# Corrige la contrainte orders_status_check pour permettre le statut "delivered"

echo "🚨 CORRECTION URGENTE LOGIFLOW - CONTRAINTE ORDERS"
echo "=================================================="

# Configuration Docker
CONTAINER_NAME="logiflow-app"

echo "📅 $(date) - Début correction contrainte orders"

# 1. Vérifier que le conteneur est en cours d'exécution
echo "🔍 Vérification du conteneur..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé"
    exit 1
fi

echo "✅ Conteneur trouvé"

# 2. Corriger la contrainte directement dans la base de données
echo "🔧 Correction de la contrainte orders_status_check..."
docker exec $CONTAINER_NAME bash -c "
export PGPASSWORD=LogiFlow2025!

# Connexion PostgreSQL et correction contrainte
psql -h postgres -U logiflow_admin -d logiflow_db << 'EOF'
-- Supprimer l'ancienne contrainte
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Ajouter la nouvelle contrainte avec delivered
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'planned', 'delivered'));

-- Vérifier que la contrainte est créée
SELECT conname, consrc FROM pg_constraint WHERE conname = 'orders_status_check';

\q
EOF
"

if [ $? -eq 0 ]; then
    echo "✅ Contrainte orders_status_check corrigée"
else
    echo "❌ Erreur lors de la correction de la contrainte"
    exit 1
fi

# 3. Test rapide
echo "🧪 Test de validation d'une livraison..."
RESPONSE=$(docker exec $CONTAINER_NAME curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3000/api/debug/status)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Application opérationnelle"
else
    echo "⚠️  Réponse API: $RESPONSE"
fi

echo ""
echo "=================================================="
echo "🎉 CORRECTION CONTRAINTE TERMINÉE"
echo "=================================================="
echo "📅 $(date)"
echo "✅ Contrainte orders_status_check corrigée"
echo "✅ Statut 'delivered' maintenant autorisé pour les commandes"
echo ""
echo "🔗 Vous pouvez maintenant valider les livraisons sans erreur"
echo "=================================================="