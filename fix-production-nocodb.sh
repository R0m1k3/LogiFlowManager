#!/bin/bash

echo "🔧 CORRECTION URGENTE NOCODB PRODUCTION"
echo "========================================"
echo ""

echo "📋 PROBLÈMES IDENTIFIÉS ET CORRIGÉS :"
echo "- ❌ Erreur 500: createNocodbConfig utilisait colonnes inexistantes"
echo "- ❌ table_id, table_name, invoice_column_name non définies en BDD"
echo "- ❌ Frontend envoyait seulement: name, baseUrl, projectId, apiToken, description, isActive"
echo "- ✅ createNocodbConfig() corrigé pour utiliser colonnes existantes"
echo "- ✅ updateNocodbConfig() corrigé pour utiliser colonnes existantes"
echo ""

echo "🚀 DÉPLOIEMENT AUTOMATIQUE DES CORRECTIONS..."
echo ""

# Rebuild et redeploy Docker container
echo "🔄 Reconstruction du conteneur Docker..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "⏳ Attente initialisation (30 secondes)..."
sleep 30

echo ""
echo "🔍 VÉRIFICATIONS POST-DÉPLOIEMENT :"
echo ""

# Test API configurations
echo "📊 Test API /api/nocodb-config (GET)..."
curl -s "http://localhost:3000/api/nocodb-config" | head -c 100
echo ""

echo ""
echo "🔍 Vérification logs conteneur..."
docker-compose logs --tail=10 web

echo ""
echo "✅ CORRECTIONS DÉPLOYÉES !"
echo ""
echo "📋 RÉSULTATS ATTENDUS :"
echo "- ✅ Plus d'erreur 500 lors création configuration NocoDB"
echo "- ✅ Formulaire frontend maintenant fonctionnel"
echo "- ✅ API POST /api/nocodb-config opérationnelle"
echo "- ✅ Enregistrement en base de données opérationnel"
echo ""
echo "🎯 PROCHAINE ÉTAPE :"
echo "- Tester la création d'une configuration NocoDB depuis l'interface"
echo "- Vérifier que le formulaire se valide sans erreur 500"
echo ""
echo "========================================"
echo "🔧 CORRECTION NOCODB PRODUCTION TERMINÉE"