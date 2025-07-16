#!/bin/bash

# Script de test pour vérifier la création de configuration NocoDB
echo "🧪 Test de création de configuration NocoDB en production"

# Configuration de test
CONFIG_DATA='{
  "name": "Test Automatique",
  "baseUrl": "https://nocodb.ffnancy.fr",
  "projectId": "admin",
  "apiToken": "z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ",
  "description": "Test automatique de création",
  "isActive": true,
  "createdBy": "admin_local"
}'

echo "📤 Tentative de création de configuration NocoDB..."

# Test via curl
curl -X POST "http://localhost:3000/api/nocodb-config" \
  -H "Content-Type: application/json" \
  -d "$CONFIG_DATA" \
  -v

echo -e "\n\n🔍 Vérification des configurations existantes..."

# Vérification
curl -X GET "http://localhost:3000/api/nocodb-config" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n📊 Test terminé. Vérifiez les logs ci-dessus pour le résultat."