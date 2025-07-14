#!/bin/bash

echo "🔄 ACTIVATION DE L'APPLICATION COMPLÈTE..."

# Copier le serveur complet
cp server/index.production.complete.js server/index.production.js

# Sauvegarder données
echo "💾 Sauvegarde..."
BACKUP_FILE="backup_activation_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt application seulement
echo "⏹️ Arrêt application..."
docker-compose stop logiflow-app

# Rebuild application
echo "🔨 Rebuild avec toutes les fonctionnalités..."
docker-compose build logiflow-app

# Redémarrage
echo "🚀 Redémarrage application complète..."
docker-compose up -d logiflow-app

# Test
echo "⏳ Test (30s)..."
sleep 30

# Vérification
if curl -s http://localhost:3000/api/health | grep -q "production-complete"; then
    echo ""
    echo "✅ ✅ ✅ APPLICATION COMPLÈTE ACTIVÉE! ✅ ✅ ✅"
    echo ""
    echo "🌐 Application: http://localhost:3000"
    echo "🔐 Login: admin / admin"
    echo "💾 Base de données connectée"
    echo "📊 Toutes les fonctionnalités actives"
    echo ""
else
    echo "❌ Problème, logs:"
    docker-compose logs --tail=20 logiflow-app
fi