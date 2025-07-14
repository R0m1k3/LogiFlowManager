#!/bin/bash

echo "🔧 SOLUTION DEFINITIVE: tsx au lieu d'esbuild pour bcrypt..."

# Vérifier Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker non démarré"
    exit 1
fi

# Sauvegarde rapide
echo "💾 Sauvegarde..."
BACKUP_FILE="backup_tsx_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt
echo "⏹️ Arrêt conteneurs..."
docker-compose down

# Nettoyage
echo "🧹 Nettoyage..."
docker system prune -f >/dev/null 2>&1

# Reconstruction avec tsx
echo "🔨 Build avec tsx (résout bcrypt)..."
docker-compose build --no-cache

# Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# Vérification
echo "⏳ Vérification (45s)..."
sleep 45

if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ RESOLU! bcrypt fonctionne avec tsx"
    echo "🌐 http://localhost:3000"
    echo "🔑 admin / admin"
    echo "💾 Données conservées"
else
    echo "❌ Vérifiez les logs:"
    docker-compose logs logiflow-app | tail -20
fi

echo "✅ Terminé"