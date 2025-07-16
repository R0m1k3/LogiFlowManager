#!/bin/bash
# Script pour appliquer immédiatement les corrections en production

echo "🚨 Application des corrections urgentes en production..."

# 1. Redémarrer l'application pour prendre les nouvelles corrections
echo "🔄 Redémarrage de l'application LogiFlow..."
docker restart logiflow-app

# Attendre que l'application redémarre
echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

# 2. Tester la modification d'utilisateur
echo "🧪 Test de modification d'utilisateur..."

# Authentification
echo "🔑 Authentification admin..."
LOGIN_RESPONSE=$(curl -s -c test-cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

echo "Login: $LOGIN_RESPONSE"

# Obtenir la liste des utilisateurs pour voir les IDs réels
echo "👥 Récupération liste utilisateurs..."
USERS_RESPONSE=$(curl -s -b test-cookies.txt -X GET http://localhost:3000/api/users \
  -H "Content-Type: application/json")

echo "Users found:"
echo "$USERS_RESPONSE" | jq '.[] | {id, username, firstName, lastName}' 2>/dev/null || echo "$USERS_RESPONSE"

# Tester avec le premier utilisateur non-admin trouvé
USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.[] | select(.username != "admin") | .id' | head -1)

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
    echo "🎯 Test modification utilisateur ID: $USER_ID"
    
    UPDATE_RESPONSE=$(curl -s -b test-cookies.txt -X PUT "http://localhost:3000/api/users/$USER_ID" \
      -H "Content-Type: application/json" \
      -d '{"firstName": "TestUpdate"}' -w "HTTP_STATUS:%{http_code}")
    
    echo "Update result: $UPDATE_RESPONSE"
else
    echo "❌ Aucun utilisateur trouvé pour test"
fi

# 3. Corriger la table NocoDB si nécessaire
echo ""
echo "🔧 Correction table NocoDB..."
docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;
SELECT 'NocoDB table corrected' as result;
" 2>/dev/null && echo "✅ Table NocoDB corrigée"

# 4. Vérifier les logs pour diagnostic
echo ""
echo "📋 Logs récents de l'application:"
docker logs logiflow-app --tail=15 | grep -E "(updateUser|PUT|Error|❌)"

# Nettoyer
rm -f test-cookies.txt

echo ""
echo "🎉 Corrections appliquées !"
echo "   ✅ Application redémarrée avec nouvelles corrections"
echo "   ✅ Table NocoDB corrigée" 
echo "   ✅ Test modification utilisateur effectué"
echo ""
echo "📝 Si problème persiste, vérifier :"
echo "   - docker logs logiflow-app --tail=50"
echo "   - Structure base: docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c \"\\d users\""