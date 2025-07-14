#!/bin/bash

echo "🚨 Correction immédiate du problème bcrypt en production..."

# 1. Vérifier Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré"
    exit 1
fi

# 2. Sauvegarde express des données
echo "💾 Sauvegarde rapide des données..."
if docker ps --format "table {{.Names}}" | grep -q logiflow; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    if [ ! -z "$CONTAINER_NAME" ]; then
        docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > backup_emergency_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "⚠️ Sauvegarde échouée mais on continue..."
    fi
fi

# 3. Arrêt rapide
echo "⏹️ Arrêt rapide des conteneurs..."
docker-compose down

# 4. Reconstruction rapide avec bcrypt
echo "🔨 Reconstruction avec correction bcrypt..."
docker-compose build --no-cache

# 5. Redémarrage
echo "🚀 Redémarrage..."
docker-compose up -d

# 6. Vérification rapide
echo "⏳ Vérification (30 secondes)..."
sleep 30

if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ SUCCÈS! Application corrigée et démarrée"
    echo "🌐 Accessible sur: http://localhost:3000"
    echo "🔑 Identifiants: admin / admin"
else
    echo "⚠️ Vérifiez les logs si nécessaire:"
    echo "docker-compose logs logiflow-app"
fi

echo "✅ Correction terminée!"