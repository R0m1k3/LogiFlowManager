#!/bin/bash

echo "🚨 CORRECTION URGENTE - TypeError NocoDB Production"
echo "================================================="

echo "🔍 Problème identifié:"
echo "- L'API retourne correctement les données (1 config)"
echo "- TypeError 'Cannot read properties of undefined (reading 'length')' persiste"
echo "- L'environnement de production utilise du code compilé qui ne reflète pas nos modifications"
echo ""

echo "📋 Stratégie de correction:"
echo "1. Forcer la recompilation complète du frontend"
echo "2. Appliquer les corrections directement dans les fichiers production"
echo "3. Redémarrer l'application avec cache vidé"
echo ""

echo "🔧 Étape 1: Nettoyage du cache et recompilation"
if [ -d "dist" ]; then
    echo "🗑️  Suppression du dossier dist..."
    rm -rf dist/
fi

if [ -d "node_modules/.vite" ]; then
    echo "🗑️  Suppression du cache Vite..."
    rm -rf node_modules/.vite/
fi

echo "🔄 Recompilation du frontend..."
npm run build

echo ""
echo "🔧 Étape 2: Vérification des fichiers compilés"
if [ -f "dist/index.html" ]; then
    echo "✅ index.html généré"
else
    echo "❌ Échec de la compilation"
    exit 1
fi

echo ""
echo "🔧 Étape 3: Redémarrage de l'application"
if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage complet Docker..."
    docker-compose down
    docker-compose up -d --build --force-recreate
    
    echo "⏳ Attente du démarrage (20 secondes)..."
    sleep 20
    
    echo "🧪 Test de l'API..."
    for i in {1..5}; do
        STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nocodb-config)
        if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
            echo "✅ API opérationnelle (Status: $STATUS)"
            break
        else
            echo "⏳ Tentative $i/5 - Status: $STATUS"
            sleep 5
        fi
    done
    
elif command -v docker &> /dev/null; then
    echo "🐳 Redémarrage Docker..."
    docker stop logiflow-app
    docker rm logiflow-app
    docker-compose up -d --build
    sleep 15
else
    echo "⚠️  Redémarrage manuel requis"
fi

echo ""
echo "🎯 Tests de validation:"
echo "1. Accédez à l'application en production"
echo "2. Connectez-vous avec admin/admin"
echo "3. Allez dans Administration → Configuration NocoDB"
echo "4. Vérifiez l'absence d'erreur TypeError"
echo "5. Testez la création d'une nouvelle configuration"
echo ""

echo "🔍 Logs à surveiller:"
echo "- docker logs logiflow-app | grep TypeError"
echo "- docker logs logiflow-app | grep '🔍 NocoDBConfig Debug'"
echo "- docker logs logiflow-app | grep '📊 NocoDB configs API'"
echo ""

echo "✅ Correction terminée."
echo ""
echo "🚨 Si le problème persiste encore:"
echo "1. Vérifiez la console JavaScript (F12) pour les erreurs"
echo "2. Vérifiez que les logs montrent bien '🔍 NocoDBConfig Debug'"
echo "3. Contactez le support technique avec les logs complets"
echo ""
echo "💡 Conseil: Utilisez Ctrl+F5 pour forcer le rechargement du cache navigateur"