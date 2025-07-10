#!/bin/bash

echo "🔧 MISE À JOUR PRODUCTION LOGIFLOW"
echo "=================================="

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker et Docker Compose détectés"

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Reconstruire l'image sans cache
echo "🔨 Reconstruction de l'image Docker..."
docker-compose build --no-cache

# Redémarrer les conteneurs
echo "🚀 Redémarrage des conteneurs..."
docker-compose up -d

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des conteneurs
echo "📊 État des conteneurs:"
docker-compose ps

# Tester la connectivité
echo "🔍 Test de connectivité..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application accessible sur port 3000"
else
    echo "⚠️  Application non accessible - vérifiez les logs:"
    echo "   docker-compose logs -f"
fi

echo ""
echo "🎯 MISE À JOUR TERMINÉE"
echo "======================"
echo "Application: http://localhost:3000"
echo "Connexion: admin / admin"
echo ""
echo "Si problème persistant, consultez les logs:"
echo "docker-compose logs -f"