#!/bin/bash

echo "🔄 RETOUR A LA CONFIGURATION SIMPLE QUI MARCHE..."

# Sauvegarder les données
echo "💾 Sauvegarde des données..."
BACKUP_FILE="backup_simple_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt propre
echo "⏹️ Arrêt des conteneurs..."
docker-compose down

# Nettoyage
echo "🧹 Nettoyage..."
docker system prune -f

# Build simple sans bcrypt
echo "🔨 Build simple (sans bcrypt)..."
docker-compose build --no-cache

# Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# Attente plus longue pour PostgreSQL
echo "⏳ Attente initialisation (60s)..."
sleep 60

# Vérification
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo ""
    echo "✅ SUCCÈS! Configuration simple opérationnelle"
    echo "🌐 Application: http://localhost:3000"
    echo "💾 Données préservées"
    echo ""
    echo "ℹ️ Version simplifiée sans bcrypt en cours"
else
    echo ""
    echo "❌ Problème de démarrage"
    echo "📋 Logs:"
    docker-compose logs --tail=20 logiflow-app
fi

echo "✅ Processus terminé"