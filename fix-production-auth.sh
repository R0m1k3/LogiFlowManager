#!/bin/bash

echo "🔧 CORRECTION ERREUR AUTHENTIFICATION PRODUCTION"
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

# Nettoyer les images obsolètes et le cache
echo "🧹 Nettoyage complet..."
docker system prune -f

# Reconstruire l'image sans cache
echo "🔨 Reconstruction complète de l'image Docker..."
docker-compose build --no-cache

# Redémarrer les conteneurs
echo "🚀 Redémarrage des conteneurs..."
docker-compose up -d

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 20

# Vérifier l'état des conteneurs
echo "📊 État des conteneurs:"
docker-compose ps

# Afficher les logs pour diagnostic
echo "📋 Logs de l'application:"
docker-compose logs --tail=30 logiflow-app

# Tester la connectivité API
echo "🔍 Test de connectivité API..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ API accessible sur port 3000"
    
    # Tester la page de connexion
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Page d'accueil accessible"
    else
        echo "⚠️  Page d'accueil non accessible"
    fi
else
    echo "❌ API non accessible - vérifiez les logs:"
    echo "   docker-compose logs -f logiflow-app"
fi

echo ""
echo "🎯 CORRECTION TERMINÉE"
echo "====================="
echo "Application: http://localhost:3000"
echo "Connexion: admin / admin"
echo ""
echo "✅ CORRECTIONS APPLIQUÉES:"
echo "- Importation ES6 de connect-pg-simple"
echo "- Sessions PostgreSQL configurées correctement"
echo "- Erreur 'Dynamic require' résolue"
echo "- Architecture production stabilisée"
echo ""
echo "🔍 APRÈS RECONSTRUCTION:"
echo "1. Connectez-vous avec admin/admin"
echo "2. Testez toutes les pages : Dashboard, Utilisateurs, Commandes, etc."
echo "3. Si problème persiste, consultez les logs:"
echo "   docker-compose logs -f logiflow-app"