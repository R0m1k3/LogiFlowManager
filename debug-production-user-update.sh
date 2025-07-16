#!/bin/bash
# Script pour diagnostiquer les problèmes de modification d'utilisateurs en production

echo "🔍 Diagnostic modification utilisateurs en production..."

# Test avec curl pour vérifier l'API directement
echo "📡 Test API modification utilisateur Rudolph MATTON..."

# D'abord obtenir un cookie de session
echo "🔑 Authentification..."
LOGIN_RESPONSE=$(curl -s -c production-cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

echo "Login response: $LOGIN_RESPONSE"

# Tester la modification avec des données minimales
echo "📝 Test modification avec données minimales..."
UPDATE_RESPONSE=$(curl -s -b production-cookies.txt -X PUT http://localhost:3000/api/users/ff292 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rudolph",
    "lastName": "MATTON",
    "username": "directionfrouard",
    "email": "directionfrouard@ffest.fr"
  }' -w "HTTP_STATUS:%{http_code}")

echo "Update response: $UPDATE_RESPONSE"

# Vérifier les logs du conteneur pour voir l'erreur exacte
echo ""
echo "📋 Logs récents du conteneur LogiFlow:"
docker logs logiflow-app --tail=20 | grep -E "(PUT|Error|❌|🔄)"

# Tester avec encore moins de données
echo ""
echo "🧪 Test avec données ultra-minimales..."
MINIMAL_RESPONSE=$(curl -s -b production-cookies.txt -X PUT http://localhost:3000/api/users/ff292 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "RudolphTest"}' -w "HTTP_STATUS:%{http_code}")

echo "Minimal update response: $MINIMAL_RESPONSE"

# Nettoyer
rm -f production-cookies.txt

echo ""
echo "🔧 Actions de débogage supplémentaires :"
echo "   1. Vérifier structure base : docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c \"\\d users\""
echo "   2. Vérifier données utilisateur : docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c \"SELECT id, username, first_name, last_name FROM users WHERE id='ff292';\""
echo "   3. Logs complets : docker logs logiflow-app --tail=50"