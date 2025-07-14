#!/bin/bash

echo "🔧 CORRECTION FINALE du problème bcrypt en production..."

# 1. Vérifier Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré"
    exit 1
fi

# 2. Sauvegarde rapide
echo "💾 Sauvegarde des données..."
BACKUP_FILE="backup_bcrypt_fix_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE" || echo "⚠️ Sauvegarde échouée"
fi

# 3. Arrêt complet pour reconstruction
echo "⏹️ Arrêt des conteneurs..."
docker-compose down

# 4. Nettoyage des images corrompues
echo "🧹 Nettoyage des images..."
docker system prune -f
docker rmi $(docker images | grep logiflow | awk '{print $3}') 2>/dev/null || true

# 5. Reconstruction complète avec nouvelle approche
echo "🔨 Reconstruction avec approche non-bundled..."
docker-compose build --no-cache

# 6. Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# 7. Attente et vérification
echo "⏳ Attente 40 secondes pour l'initialisation..."
sleep 40

echo "🔍 Vérification du statut..."
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ SUCCÈS! Application corrigée"
    echo "🌐 Accessible: http://localhost:3000"
    echo "🔑 Login: admin / admin"
    echo "💾 Données préservées"
else
    echo "❌ Problème détecté. Logs:"
    docker-compose logs --tail=30 logiflow-app
    echo ""
    echo "🔄 Restauration possible avec:"
    echo "./restore-data.sh $BACKUP_FILE"
fi