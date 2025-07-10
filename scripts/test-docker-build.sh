#!/bin/bash

echo "🔄 Test rapide du build Docker..."

# Test dans un container temporaire
docker run --rm -v $(pwd):/workspace -w /workspace node:20-alpine sh -c "
  npm ci --silent
  npm run build > /dev/null 2>&1
  node server/build.js
  echo '✅ Build production terminé'
  ls -la dist/
  echo '🔍 Premières lignes du fichier générés:'
  head -5 dist/index.js
"