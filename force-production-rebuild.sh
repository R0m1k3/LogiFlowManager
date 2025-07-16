#!/bin/bash

echo "🚨 FORCE REBUILD PRODUCTION - TypeError NocoDB"
echo "=============================================="

echo "🔍 Problème identifié :"
echo "- L'API backend fonctionne correctement (1 config retournée)"
echo "- L'erreur TypeError persiste dans le frontend compilé"
echo "- Les corrections développement ne sont pas appliquées en production"
echo ""

echo "🔧 Solution : Reconstruction complète forcée"
echo ""

# Étape 1: Vérifier l'environnement
echo "📋 Étape 1: Vérification de l'environnement"
if [ -d "dist" ]; then
    echo "✅ Dossier dist détecté"
    rm -rf dist/
    echo "🗑️  Dossier dist supprimé"
else
    echo "⚠️  Aucun dossier dist trouvé"
fi

if [ -d "node_modules/.vite" ]; then
    echo "✅ Cache Vite détecté"
    rm -rf node_modules/.vite/
    echo "🗑️  Cache Vite supprimé"
else
    echo "⚠️  Aucun cache Vite trouvé"
fi

echo ""

# Étape 2: Rebuild complet
echo "📋 Étape 2: Rebuild complet du frontend"
echo "🔄 Lancement de la compilation..."

# Utiliser timeout pour éviter les blocages
timeout 300 npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build terminé avec succès"
else
    echo "❌ Échec du build ou timeout"
    echo "⚠️  Tentative de build alternative..."
    
    # Build alternatif avec flags spécifiques
    cd client && timeout 180 npx vite build --force && cd ..
    
    if [ $? -eq 0 ]; then
        echo "✅ Build alternatif réussi"
    else
        echo "❌ Échec du build alternatif"
        echo "🔧 Essai avec build basique..."
        
        # Build minimal
        cd client && npm run build:basic 2>/dev/null || npx vite build --no-deps && cd ..
    fi
fi

echo ""

# Étape 3: Vérification des fichiers générés
echo "📋 Étape 3: Vérification des fichiers générés"
if [ -f "dist/index.html" ]; then
    echo "✅ index.html généré ($(du -h dist/index.html | cut -f1))"
else
    echo "❌ index.html manquant"
    echo "🔍 Recherche des fichiers générés..."
    find . -name "index.html" -type f 2>/dev/null | head -3
fi

if [ -d "dist/assets" ]; then
    ASSETS_COUNT=$(find dist/assets -type f | wc -l)
    echo "✅ Dossier assets généré ($ASSETS_COUNT fichiers)"
else
    echo "❌ Dossier assets manquant"
fi

echo ""

# Étape 4: Redémarrage avec force
echo "📋 Étape 4: Redémarrage de l'application"

if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage Docker complet..."
    
    # Arrêt propre
    docker-compose down --remove-orphans
    
    # Nettoyage des volumes et images
    docker system prune -f
    
    # Redémarrage avec reconstruction forcée
    docker-compose up -d --build --force-recreate --no-deps
    
    echo "⏳ Attente du démarrage (30 secondes)..."
    sleep 30
    
    # Vérification du conteneur
    if docker ps | grep -q "logiflow-app"; then
        echo "✅ Conteneur démarré"
    else
        echo "❌ Problème de démarrage du conteneur"
        docker logs logiflow-app 2>/dev/null | tail -10
    fi
    
elif command -v docker &> /dev/null; then
    echo "🐳 Redémarrage Docker simple..."
    
    # Arrêt et suppression du conteneur
    docker stop logiflow-app 2>/dev/null || true
    docker rm logiflow-app 2>/dev/null || true
    
    # Redémarrage
    docker-compose up -d --build
    sleep 20
    
else
    echo "⚠️  Docker non disponible, redémarrage manuel requis"
fi

echo ""

# Étape 5: Tests de validation
echo "📋 Étape 5: Tests de validation"

# Test de l'API
echo "🧪 Test de l'API NocoDB..."
for i in {1..5}; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nocodb-config 2>/dev/null)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
        echo "✅ API opérationnelle (Status: $STATUS)"
        break
    else
        echo "⏳ Tentative $i/5 - Status: $STATUS"
        sleep 5
    fi
done

# Test de l'application
echo "🧪 Test de l'application..."
APP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null)
if [ "$APP_STATUS" = "200" ]; then
    echo "✅ Application accessible (Status: $APP_STATUS)"
else
    echo "⚠️  Application non accessible (Status: $APP_STATUS)"
fi

echo ""

# Étape 6: Instructions finales
echo "📋 Étape 6: Instructions de vérification"
echo ""
echo "🎯 Tests à effectuer :"
echo "1. Accéder à l'application : http://localhost:3000"
echo "2. Se connecter avec admin/admin"
echo "3. Aller dans Administration → Configuration NocoDB"
echo "4. Vérifier l'absence d'erreur TypeError dans la console (F12)"
echo "5. Tester la création d'une configuration"
echo ""

echo "🔍 Logs à surveiller :"
echo "- Console JavaScript : Rechercher '🔍 NocoDBConfig Debug'"
echo "- Backend : docker logs logiflow-app | grep '📊 NocoDB configs API'"
echo "- Erreurs : docker logs logiflow-app | grep TypeError"
echo ""

echo "✅ Reconstruction forcée terminée."
echo ""
echo "🚨 Si l'erreur persiste :"
echo "1. Vider complètement le cache navigateur (Ctrl+Shift+Del)"
echo "2. Essayer en navigation privée"
echo "3. Vérifier les logs de la console JavaScript"
echo "4. Redémarrer le navigateur"
echo ""

echo "💡 Astuce : Utiliser Ctrl+F5 pour forcer le rechargement sans cache"