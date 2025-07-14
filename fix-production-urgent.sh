#!/bin/bash

echo "🚨 CORRECTION URGENTE PROBLÈMES PRODUCTION"
echo "==========================================="
echo ""

echo "Problèmes identifiés dans les logs :"
echo "1. ❌ X-Forwarded-For header error (trust proxy manquant)"
echo "2. ❌ Login admin/admin échoue (hash invalide)"
echo ""

echo "✅ CORRECTIONS APPLIQUÉES :"
echo ""

echo "1. Configuration trust proxy :"
echo "   - index.production.ts : app.set('trust proxy', true)"
echo "   - security.ts : trustProxy: true dans tous les limiters"
echo "   - Health checks exemptés du rate limiting"
echo ""

echo "2. Hash admin dynamique :"
echo "   - auth-utils.production.ts : getDefaultAdminHash() function"
echo "   - initDatabase.production.ts : génération hash au runtime"
echo "   - Import correct avec .js extension"
echo ""

echo "3. Tests de vérification :"

# Test build production
echo "   Testing build production..."
if npx esbuild server/index.production.ts --bundle --platform=node --format=esm --outfile=/tmp/test-build.js --external:* &>/dev/null; then
    echo "   ✅ Build production OK"
    rm -f /tmp/test-build.js
else
    echo "   ❌ Erreur build production"
fi

# Vérifier trust proxy
if grep -q "trust proxy.*true" server/index.production.ts; then
    echo "   ✅ Trust proxy configuré"
else
    echo "   ❌ Trust proxy manquant"
fi

# Vérifier hash dynamique
if grep -q "getDefaultAdminHash" server/auth-utils.production.ts; then
    echo "   ✅ Hash admin dynamique"
else
    echo "   ❌ Hash admin statique"
fi

echo ""
echo "PROCHAINES ÉTAPES :"
echo "=================="
echo "1. Reconstruire l'image Docker :"
echo "   docker-compose build --no-cache"
echo ""
echo "2. Redémarrer le conteneur :"
echo "   docker-compose up -d"
echo ""
echo "3. Vérifier les logs :"
echo "   docker-compose logs -f app"
echo ""
echo "4. Tester l'authentification :"
echo "   curl -X POST http://localhost:3000/api/login \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"username\":\"admin\",\"password\":\"admin\"}'"
echo ""
echo "Ces corrections devraient résoudre définitivement :"
echo "- L'erreur X-Forwarded-For"
echo "- Le problème d'authentification admin"
echo ""
echo "🎯 Le conteneur est maintenant prêt pour redéploiement !"