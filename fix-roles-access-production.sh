#!/bin/bash
set -e

echo "🔧 Script de correction des accès aux rôles en production"
echo "======================================================"

echo ""
echo "📋 Résumé des corrections appliquées :"
echo "✅ API /api/roles - Accès autorisé pour tous les utilisateurs authentifiés"
echo "✅ API /api/permissions - Accès autorisé pour tous les utilisateurs authentifiés" 
echo "✅ API /api/users - Accès autorisé pour admins ET managers"
echo ""

echo "🐳 Reconstruction du conteneur Docker..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage du conteneur (30 secondes)..."
sleep 30

echo ""
echo "🔍 Vérification du statut du conteneur..."
docker-compose ps

echo ""
echo "📊 Test des APIs corrigées..."

# Test API Roles
echo "🎨 Test /api/roles..."
ROLES_RESPONSE=$(curl -s -b cookies.txt http://localhost:3000/api/roles || echo "ERREUR")
if [[ "$ROLES_RESPONSE" == *"id"* ]]; then
    echo "✅ API /api/roles fonctionne correctement"
    echo "   Rôles retournés: $(echo $ROLES_RESPONSE | jq -r '. | length // "ERREUR"') rôles"
else
    echo "❌ Erreur API /api/roles: $ROLES_RESPONSE"
fi

# Test API Permissions
echo "🔐 Test /api/permissions..."
PERMS_RESPONSE=$(curl -s -b cookies.txt http://localhost:3000/api/permissions || echo "ERREUR")
if [[ "$PERMS_RESPONSE" == *"id"* ]]; then
    echo "✅ API /api/permissions fonctionne correctement"
    echo "   Permissions retournées: $(echo $PERMS_RESPONSE | jq -r '. | length // "ERREUR"') permissions"
else
    echo "❌ Erreur API /api/permissions: $PERMS_RESPONSE"
fi

# Test API Users
echo "👥 Test /api/users..."
USERS_RESPONSE=$(curl -s -b cookies.txt http://localhost:3000/api/users || echo "ERREUR")
if [[ "$USERS_RESPONSE" == *"id"* ]]; then
    echo "✅ API /api/users fonctionne correctement"
    echo "   Utilisateurs retournés: $(echo $USERS_RESPONSE | jq -r '. | length // "ERREUR"') utilisateurs"
else
    echo "❌ Erreur API /api/users: $USERS_RESPONSE"
fi

echo ""
echo "🎯 Test complet de la gestion des rôles..."
echo "📱 Accédez à l'interface : http://localhost:3000"
echo "🔑 Connectez-vous avec: admin / admin"
echo "⚙️  Allez dans: Administration > Gestion des Rôles"
echo ""
echo "✅ Les couleurs des rôles devraient maintenant s'afficher correctement !"
echo "✅ L'erreur 'Rôle ID 6' ne devrait plus apparaître"

echo ""
echo "📋 Logs Docker en temps réel (Ctrl+C pour arrêter) :"
docker-compose logs -f --tail=50