#!/bin/bash

# Script de correction RAPIDE - LogiFlow
# Corrige temporairement le code production pour éviter l'erreur delivered_date

echo "🔧 CORRECTION RAPIDE LOGIFLOW - ERREUR DELIVERED_DATE"
echo "=============================================="

# Configuration Docker
CONTAINER_NAME="logiflow-app"

echo "📅 $(date) - Début correction rapide"

# 1. Vérifier que le conteneur est en cours d'exécution
echo "🔍 Vérification du conteneur..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé"
    exit 1
fi

echo "✅ Conteneur trouvé"

# 2. Créer la correction temporaire dans le conteneur
echo "📝 Correction du code production..."
docker exec $CONTAINER_NAME bash -c "cat > /tmp/fix-query.js << 'EOF'
const fs = require('fs');

// Lecture du fichier
let content = fs.readFileSync('/app/dist/index.js', 'utf8');

// Remplacement de la requête problématique
const oldQuery = 'd.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.delivered_date, d.validated_at, d.quantity';
const newQuery = 'd.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, NULL as delivered_date, NULL as validated_at, d.quantity';

if (content.includes(oldQuery)) {
    content = content.replace(new RegExp(oldQuery, 'g'), newQuery);
    fs.writeFileSync('/app/dist/index.js', content);
    console.log('✅ Requête corrigée dans le bundle');
} else {
    console.log('⚠️  Requête non trouvée - peut-être déjà corrigée');
}
EOF

node /tmp/fix-query.js"

if [ $? -eq 0 ]; then
    echo "✅ Code corrigé"
else
    echo "❌ Erreur lors de la correction"
    exit 1
fi

# 3. Redémarrer l'application
echo "🔄 Redémarrage de l'application..."
docker restart $CONTAINER_NAME

# Attendre que l'application redémarre
echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

# 4. Test de santé
echo "🏥 Test de santé de l'application..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Application opérationnelle (HTTP $HEALTH_CHECK)"
else
    echo "⚠️  Application peut être en cours de démarrage (HTTP $HEALTH_CHECK)"
fi

echo ""
echo "=============================================="
echo "🎉 CORRECTION RAPIDE TERMINÉE"
echo "=============================================="
echo "📅 $(date)"
echo "✅ Erreur delivered_date corrigée temporairement"
echo "✅ Application redémarrée"
echo ""
echo "🔗 Application accessible: http://localhost:3000"
echo "   ou https://logiflow.ffnancy.fr:3000"
echo ""
echo "⚠️  ATTENTION: Cette correction est TEMPORAIRE"
echo "   Pour une solution permanente, exécutez:"
echo "   ./fix-production-complete.sh"
echo "=============================================="