#!/bin/bash

echo "🔍 Debug CRUD operations en production"
echo "⏱️  $(date '+%H:%M:%S') - Test des créations"

echo ""
echo "📋 Test 1: Création groupe via curl"
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3AgUvzRF4..." \
  -d '{"name":"Test Debug Group","color":"#FF5722"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq .

echo ""
echo "📋 Test 2: Création fournisseur via curl"
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3AgUvzRF4..." \
  -d '{"name":"Test Debug Supplier","contact":"test@debug.fr","phone":"0123456789"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq .

echo ""
echo "📋 Test 3: Vérification de l'authentification"
curl -X GET http://localhost:3000/api/user \
  -H "Cookie: connect.sid=s%3AgUvzRF4..." \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq .

echo ""
echo "📊 Pour un test complet, ouvrez les logs du serveur et essayez de créer via l'interface"
echo "Les logs doivent montrer:"
echo "✅ Request body reçu"
echo "✅ User permissions validées"
echo "✅ Data validation réussie"
echo "❌ Erreur lors de l'exécution SQL"