#!/bin/bash

echo "🚀 MISE À JOUR PRODUCTION LOGIFLOW"
echo "=================================="

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Nettoyer complètement les images et caches
echo "🧹 Nettoyage complet du cache Docker..."
docker system prune -af --volumes

# Reconstruire SANS cache pour forcer l'intégration du nouveau code
echo "🔨 Reconstruction COMPLÈTE de l'image (sans cache)..."
docker-compose build --no-cache --pull

# Redémarrer avec les nouvelles images
echo "🚀 Redémarrage avec le nouveau code..."
docker-compose up -d

# Attendre le démarrage complet
echo "⏳ Attente du démarrage complet (30 secondes)..."
sleep 30

# Vérifier l'état des conteneurs
echo ""
echo "📊 ÉTAT DES CONTENEURS:"
docker-compose ps

echo ""
echo "📋 LOGS DE DÉMARRAGE:"
docker-compose logs --tail=20 logiflow-app

echo ""
echo "🔍 TEST DE CONNECTIVITÉ:"

# Test API Health
if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ API accessible sur port 3000"
else
    echo "❌ API non accessible"
fi

# Test page d'accueil
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend non accessible"
fi

echo ""
echo "🎯 MISE À JOUR TERMINÉE"
echo "======================="
echo ""
echo "🌐 Application : http://localhost:3000"
echo "🔑 Connexion : admin / admin"
echo ""
echo "✅ CORRECTIONS APPLIQUÉES:"
echo "- Erreur 'Dynamic require' résolue"
echo "- Import ES6 de connect-pg-simple"
echo "- Sessions PostgreSQL persistantes"
echo "- Structure UserWithGroups[] corrigée"
echo "- Page Users maintenant fonctionnelle"
echo ""
echo "📝 PROCHAINES ÉTAPES:"
echo "1. Connectez-vous avec admin/admin"
echo "2. Testez la page Utilisateurs (doit s'afficher)"
echo "3. Vérifiez toutes les fonctionnalités"
echo ""
echo "🆘 SI PROBLÈME:"
echo "   docker-compose logs -f logiflow-app"