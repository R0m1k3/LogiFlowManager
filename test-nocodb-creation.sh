#!/bin/bash

echo "🧪 TEST - Vérification NocoDB Configuration"
echo "========================================="

echo "🔍 Vérification des logs application..."
echo "Recherche des messages de debug NocoDB..."

# Vérifier si l'application fonctionne
echo "🌐 Test de l'application..."
if curl -s http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Application accessible sur localhost:5000"
else
    echo "❌ Application non accessible"
fi

# Test de l'API NocoDB
echo "🔌 Test de l'API NocoDB..."
API_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/nocodb-config" -H "Cookie: connect.sid=..." 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API NocoDB répond"
    echo "📊 Réponse API: $API_RESPONSE"
else
    echo "❌ API NocoDB non accessible (probablement non authentifié)"
fi

echo ""
echo "📋 Instructions de test manuel :"
echo "1. Ouvrir l'application dans le navigateur"
echo "2. Se connecter avec admin/admin"
echo "3. Aller dans Administration → Configuration NocoDB"
echo "4. Vérifier dans la console (F12) les messages :"
echo "   - '🔍 NocoDBConfig Debug' avec isArray: true"
echo "   - Aucune erreur TypeError"
echo "5. Essayer de créer une nouvelle configuration"
echo ""

echo "✅ Si vous voyez ces messages dans la console, le problème est résolu !"
echo "🎯 Vérification terminée."