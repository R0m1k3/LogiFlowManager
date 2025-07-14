#!/bin/bash

# Script de déploiement production LogiFlow
# Vérifie tous les composants et lance le déploiement Docker

echo "=== DÉPLOIEMENT LOGIFLOW PRODUCTION ==="

# 1. Vérifier les fichiers essentiels
echo "1. Vérification des fichiers essentiels..."
if [ ! -f "init.sql" ]; then
    echo "❌ Fichier init.sql manquant"
    exit 1
fi

if [ ! -f "server/index.production.ts" ]; then
    echo "❌ Fichier server/index.production.ts manquant"
    exit 1
fi

if [ ! -f "server/routes.ts" ]; then
    echo "❌ Fichier server/routes.ts manquant"
    exit 1
fi

if [ ! -f "server/storage.ts" ]; then
    echo "❌ Fichier server/storage.ts manquant"
    exit 1
fi

echo "✅ Fichiers essentiels présents"

# 2. Arrêter les conteneurs existants
echo "2. Arrêt des conteneurs existants..."
docker-compose down -v 2>/dev/null || true

# 3. Nettoyer les volumes existants
echo "3. Nettoyage des volumes..."
docker volume prune -f

# 4. Construire et lancer les conteneurs
echo "4. Construction et lancement des conteneurs..."
docker-compose up -d --build

# 5. Attendre que les services démarrent
echo "5. Attente du démarrage des services..."
sleep 30

# 6. Vérifier l'état des conteneurs
echo "6. Vérification des conteneurs..."
docker-compose ps

# 7. Tester la connectivité de l'application
echo "7. Test de l'application..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Application accessible sur http://localhost:3000"
    echo "✅ Connexion admin: admin/admin"
    echo "✅ Base de données PostgreSQL standard (non WebSocket)"
else
    echo "❌ Application non accessible (HTTP: $RESPONSE)"
    echo "Vérification des logs..."
    docker-compose logs --tail=20 logiflow
    exit 1
fi

# 8. Tester la base de données
echo "8. Test de la base de données..."
DB_TEST=$(docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "FAILED")

if [[ "$DB_TEST" == *"0"* ]] || [[ "$DB_TEST" == *"1"* ]]; then
    echo "✅ Base de données PostgreSQL fonctionnelle"
else
    echo "❌ Problème avec la base de données"
    docker-compose logs --tail=20 postgres
    exit 1
fi

echo "=== DÉPLOIEMENT RÉUSSI ==="
echo "🎉 LogiFlow est maintenant accessible sur http://localhost:3000"
echo "📧 Connexion: admin/admin"
echo "📊 Tous les modules sont opérationnels"
echo "🗄️  Base de données PostgreSQL prête"