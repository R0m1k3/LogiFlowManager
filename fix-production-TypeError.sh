#!/bin/bash

echo "🔧 Correction URGENTE du problème TypeError 'Cannot read properties of undefined (reading 'length')'"
echo "=================================================================="

echo "📋 Problème identifié :"
echo "- TypeError dans Groups.tsx : nocodbConfigs.map() peut être undefined"
echo "- TypeError dans NocoDBConfig.tsx : configs.length peut être undefined"
echo "- API routes.production.ts : getNocodbConfigs() peut retourner undefined"
echo "- API storage.production.ts : getNocodbConfigs() peut retourner undefined"
echo ""

echo "✅ Corrections appliquées :"
echo "- Groups.tsx : nocodbConfigs.map → (nocodbConfigs || []).map"
echo "- NocoDBConfig.tsx : configs → safeConfigs avec protection Array.isArray"
echo "- routes.production.ts : res.json(Array.isArray(configs) ? configs : [])"
echo "- storage.production.ts : return Array.isArray(result.rows) ? result.rows : []"
echo ""

echo "🔄 Redémarrage de l'application en production..."

# Rebuild et redémarrage du conteneur
if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage complet via Docker Compose..."
    docker-compose down
    docker-compose up -d --build
elif command -v docker &> /dev/null; then
    echo "🐳 Redémarrage via Docker..."
    docker restart logiflow-app
else
    echo "⚠️  Docker non trouvé, veuillez redémarrer manuellement l'application"
fi

echo ""
echo "⏳ Attente de 10 secondes pour le démarrage..."
sleep 10

echo ""
echo "🧪 Test de vérification automatique :"
echo "1. Test API NocoDB:"
if command -v curl &> /dev/null; then
    echo "   GET /api/nocodb-config"
    curl -s -X GET http://localhost:3000/api/nocodb-config | head -200
    echo ""
    echo "   Status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nocodb-config)"
else
    echo "   curl non disponible, testez manuellement"
fi

echo ""
echo "2. Test Pages à vérifier :"
echo "   - Administration → Configuration NocoDB"
echo "   - Magasins (pour vérifier le dropdown NocoDB)"
echo "   - Vérifiez qu'il n'y a plus d'erreur TypeError"
echo ""

echo "✅ Correction terminée. L'erreur TypeError devrait être définitivement résolue."
echo ""
echo "🎯 Points de contrôle :"
echo "- Backend : Array.isArray() protection dans routes et storage"
echo "- Frontend : Protection safeConfigs dans NocoDBConfig.tsx"
echo "- Frontend : Protection (|| []) dans Groups.tsx"
echo ""