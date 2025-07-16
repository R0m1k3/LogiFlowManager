#!/bin/bash
# Script pour tester et corriger la modification d'utilisateurs en production

echo "🔧 Test de modification d'utilisateurs en production..."

# Test API direct pour modifier un utilisateur
echo "📝 Test de modification via API..."

# Obtenir la liste des utilisateurs pour tester
echo "👥 Récupération de la liste des utilisateurs..."
curl -s -X GET http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -c cookies.txt | jq '.[0] | {id, username, firstName, lastName, email}'

echo ""
echo "🧪 Test de modification d'un utilisateur (changement prénom)..."

# Modifier un utilisateur existant avec des données propres
USER_ID="admin_local"  # Remplacer par un ID réel si différent

curl -s -X PUT "http://localhost:3000/api/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "firstName": "Michael Updated",
    "lastName": "SCHAL",
    "email": "admin@logiflow.com",
    "username": "admin"
  }' | jq '.'

if [ $? -eq 0 ]; then
    echo "✅ Test de modification réussi"
else
    echo "❌ Échec du test de modification"
    echo ""
    echo "🔍 Vérification des logs du conteneur..."
    docker logs logiflow-app --tail=10
fi

echo ""
echo "📋 Actions de débogage :"
echo "   1. Vérifier les logs du conteneur : docker logs logiflow-app"
echo "   2. Vérifier la structure de la base : docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c \"\\d users\""
echo "   3. Tester avec des données minimales seulement"