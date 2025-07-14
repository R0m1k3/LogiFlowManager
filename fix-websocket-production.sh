#!/bin/bash

# Script pour corriger le problème WebSocket en production
# Sans supprimer les fichiers de production existants

echo "🔧 Correction du problème WebSocket en production..."

# 1. Vérifier que Docker est en cours d'exécution
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré"
    exit 1
fi

# 2. Arrêter les conteneurs si ils sont en cours d'exécution
echo "📦 Arrêt des conteneurs existants..."
docker-compose down 2>/dev/null || true

# 3. Nettoyer le cache Docker
echo "🧹 Nettoyage du cache Docker..."
docker system prune -f

# 4. Reconstruire avec les corrections
echo "🔨 Reconstruction avec les corrections WebSocket..."
docker-compose build --no-cache

# 5. Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# 6. Attendre que les services soient prêts
echo "⏳ Attente de l'initialisation..."
sleep 10

# 7. Vérifier le statut
echo "✅ Vérification du statut..."
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Application démarrée avec succès!"
    echo "🌐 Accessible sur: http://localhost:3000"
    echo "🔑 Identifiants: admin / admin"
else
    echo "❌ Problème de démarrage, vérifiez les logs:"
    docker-compose logs --tail=20 logiflow-app
fi

echo "📊 Statut des conteneurs:"
docker-compose ps