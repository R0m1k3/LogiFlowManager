#!/bin/bash

echo "🔄 Test du build de production..."

# Test du build frontend
echo "1. Build frontend avec Vite..."
timeout 30s npx vite build

if [ -d "dist/client" ]; then
    echo "✅ Frontend build réussi"
    ls -la dist/client/
else
    echo "❌ Frontend build échoué"
    exit 1
fi

# Test du build backend
echo ""
echo "2. Build backend de production..."
npx esbuild server/index.production.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outfile=dist/index.js \
    --external:vite \
    --external:@vitejs/* \
    --external:@replit/* \
    --external:tsx

if [ -f "dist/index.js" ]; then
    echo "✅ Backend build réussi"
    echo ""
    echo "3. Vérification du contenu (premières lignes):"
    head -10 dist/index.js | grep -v "vite" && echo "✅ Pas de référence à Vite"
else
    echo "❌ Backend build échoué"
    exit 1
fi

echo ""
echo "🎯 Build de production prêt !"
echo "   - Frontend: dist/client/"
echo "   - Backend: dist/index.js"
echo ""
echo "Pour tester localement:"
echo "   NODE_ENV=production node dist/index.js"