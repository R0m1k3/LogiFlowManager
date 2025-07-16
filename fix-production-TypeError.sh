#!/bin/bash

echo "🔧 Correction du problème TypeError 'Cannot read properties of undefined (reading 'length')'"
echo "=================================================================="

echo "📋 Problème identifié :"
echo "- TypeError dans Groups.tsx : nocodbConfigs.map() peut être undefined"
echo "- TypeError dans NocoDBConfig.tsx : configs.length peut être undefined"
echo ""

echo "✅ Corrections appliquées :"
echo "- Groups.tsx : nocodbConfigs.map → (nocodbConfigs || []).map"
echo "- NocoDBConfig.tsx : configs → safeConfigs avec protection Array.isArray"
echo ""

echo "🔄 Redémarrage de l'application en production..."

# Rebuild et redémarrage du conteneur
if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage via Docker Compose..."
    docker-compose restart logiflow-app
elif command -v docker &> /dev/null; then
    echo "🐳 Redémarrage via Docker..."
    docker restart logiflow-app
else
    echo "⚠️  Docker non trouvé, veuillez redémarrer manuellement l'application"
fi

echo ""
echo "🧪 Test de vérification :"
echo "1. Accédez à Administration → Configuration NocoDB"
echo "2. Vérifiez qu'il n'y a plus d'erreur TypeError"
echo "3. Testez la création d'une nouvelle configuration"
echo ""

echo "✅ Correction terminée. L'erreur TypeError devrait être résolue."

# Optionnel : Test de l'API
echo ""
echo "🔍 Test de l'API NocoDB (optionnel):"
echo "curl -X GET http://localhost:3000/api/nocodb-config"
echo ""