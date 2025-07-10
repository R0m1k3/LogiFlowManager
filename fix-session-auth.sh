#!/bin/bash

echo "🔧 CORRECTION AUTHENTIFICATION SESSION PRODUCTION"
echo "================================================"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

echo "✅ Docker détecté"

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Nettoyer les images obsolètes
echo "🧹 Nettoyage des images obsolètes..."
docker system prune -f

# Reconstruire l'image sans cache
echo "🔨 Reconstruction complète de l'image Docker..."
docker-compose build --no-cache

# Redémarrer les conteneurs
echo "🚀 Redémarrage des conteneurs..."
docker-compose up -d

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 15

# Vérifier l'état des conteneurs
echo "📊 État des conteneurs:"
docker-compose ps

# Afficher les logs pour diagnostic
echo "📋 Logs de démarrage:"
docker-compose logs --tail=20 logiflow-app

# Tester la connectivité
echo "🔍 Test de connectivité..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application accessible sur port 3000"
    
    # Tester la page de connexion
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Page de connexion accessible"
    else
        echo "⚠️  Page de connexion non accessible"
    fi
else
    echo "❌ Application non accessible - vérifiez les logs:"
    echo "   docker-compose logs -f logiflow-app"
fi

echo ""
echo "🎯 CORRECTION TERMINÉE"
echo "====================="
echo "Application: http://localhost:3000"
echo "Connexion: admin / admin"
echo ""
echo "✅ CORRECTIONS APPLIQUÉES:"
echo "- Remplacement MemoryStore par PostgreSQL session store"
echo "- Configuration session sécurisée pour production"
echo "- Persistance des sessions entre redémarrages"
echo ""
echo "Si problème persistant, consultez les logs:"
echo "docker-compose logs -f logiflow-app"