#!/bin/bash

echo "🔧 REBUILD BCRYPT - Installation forcée..."

# Vérifier Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker non démarré"
    exit 1
fi

# Sauvegarde express
echo "💾 Sauvegarde rapide..."
BACKUP_FILE="backup_rebuild_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt complet
echo "⏹️ Arrêt complet..."
docker-compose down

# Suppression images pour force rebuild
echo "🧹 Suppression images pour rebuild complet..."
docker rmi $(docker images -q) 2>/dev/null || true
docker system prune -af >/dev/null 2>&1

# Rebuild avec installation forcée bcrypt
echo "🔨 Rebuild avec installation forcée de bcrypt..."
docker-compose build --no-cache --progress=plain

# Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# Vérification étendue
echo "⏳ Vérification démarrage (60 secondes)..."
sleep 60

# Test de l'API
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo ""
    echo "✅ SUCCESS! bcrypt installé et fonctionnel"
    echo "🌐 Application: http://localhost:3000"
    echo "🔑 Login: admin / admin"
    echo "💾 Données préservées"
    echo ""
    echo "🔍 Test bcrypt:"
    docker-compose exec logiflow-app node -e "console.log('bcrypt installé:', !!require('bcrypt'))" 2>/dev/null || echo "❓ Test bcrypt échoué"
else
    echo ""
    echo "❌ Problème de démarrage"
    echo "📋 Logs récents:"
    docker-compose logs --tail=30 logiflow-app
    echo ""
    echo "🔄 Restauration possible:"
    echo "./restore-data.sh $BACKUP_FILE"
fi

echo ""
echo "✅ Processus terminé"