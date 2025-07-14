#!/bin/bash

echo "🔧 Correction rapide ES modules..."

# Sauvegarder données
echo "💾 Sauvegarde..."
BACKUP_FILE="backup_esm_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt rapide
echo "⏹️ Arrêt..."
docker-compose down

# Rebuild rapide
echo "🔨 Rebuild avec ES modules corrigé..."
docker-compose build --no-cache logiflow-app

# Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# Vérification
echo "⏳ Vérification (30s)..."
sleep 30

if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ SUCCÈS! ES modules corrigé"
    echo "🌐 http://localhost:3000"
else
    echo "❌ Logs:"
    docker-compose logs --tail=15 logiflow-app
fi

echo "✅ Terminé"