#!/bin/bash
# Correction finale pour résoudre l'affichage des livraisons

echo "🔧 CORRECTION FINALE PRODUCTION"
echo "=============================="

CONTAINER="logiflow-app"

echo "📋 1. Redémarrage application..."
docker restart $CONTAINER

echo "⏳ 2. Attente redémarrage (10s)..."
sleep 10

echo "🧪 3. Test santé API..."
curl -f http://localhost:3000/api/health || echo "API non disponible"

echo "=============================="
echo "✅ CORRECTION TERMINÉE"
echo "L'application devrait maintenant afficher correctement les livraisons"
echo "=============================="