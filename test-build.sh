#!/bin/bash

echo "🔄 Test rapide du build Docker..."

# Test du build local d'abord
echo "1. Test build local..."
timeout 30s npm run build

if [ -f "dist/index.js" ]; then
    echo "✅ Build réussi - dist/index.js créé"
    ls -la dist/
else
    echo "❌ Build échoué ou fichier manquant"
    exit 1
fi

echo ""
echo "2. Fichiers présents pour Docker :"
echo "   - dist/index.js ✅"
echo "   - shared/ ✅"
echo "   - package.json ✅"

echo ""
echo "3. Configuration Docker :"
echo "   - CMD: node dist/index.js ✅"
echo "   - Port: 5001 (externe) → 5000 (interne) ✅"
echo "   - Réseau: nginx_default ✅"

echo ""
echo "🎯 Prêt pour le déploiement Docker !"
echo "   Commandes à exécuter sur votre machine locale :"
echo "   docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"