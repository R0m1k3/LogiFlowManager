#!/bin/bash

# Script pour corriger le problème WebSocket en production
# Sans supprimer les fichiers de production existants

echo "🔧 Correction du problème WebSocket et bcrypt en production..."

# 1. Vérifier que Docker est en cours d'exécution
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré"
    exit 1
fi

# 2. Sauvegarder les données existantes
echo "💾 Sauvegarde des données existantes..."
if docker-compose ps | grep -q "logiflow-db"; then
    echo "Base de données trouvée, sauvegarde en cours..."
    docker-compose exec -T logiflow-db pg_dump -U logiflow_admin logiflow_db > backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Sauvegarde créée: backup_$(date +%Y%m%d_%H%M%S).sql"
fi

# 3. Arrêter seulement l'application (garder la base de données)
echo "📦 Arrêt de l'application (conservation de la base de données)..."
docker-compose stop logiflow-app 2>/dev/null || true

# 4. Nettoyer seulement les images de l'application
echo "🧹 Nettoyage des images de l'application..."
docker rmi $(docker images | grep logiflow | awk '{print $3}') 2>/dev/null || true

# 5. Reconstruire seulement l'application
echo "🔨 Reconstruction de l'application avec les corrections..."
docker-compose build --no-cache logiflow-app

# 6. Démarrer les services (la base de données reste intacte)
echo "🚀 Démarrage des services..."
docker-compose up -d

# 7. Attendre que les services soient prêts
echo "⏳ Attente de l'initialisation..."
sleep 15

# 8. Vérifier le statut
echo "✅ Vérification du statut..."
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Application démarrée avec succès!"
    echo "🌐 Accessible sur: http://localhost:3000"
    echo "🔑 Identifiants: admin / admin"
    echo "💾 Vos données existantes ont été préservées"
else
    echo "❌ Problème de démarrage, vérifiez les logs:"
    docker-compose logs --tail=20 logiflow-app
    echo "🔍 Logs de la base de données:"
    docker-compose logs --tail=10 logiflow-db
fi

echo "📊 Statut des conteneurs:"
docker-compose ps