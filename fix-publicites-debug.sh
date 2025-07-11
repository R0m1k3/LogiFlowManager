#!/bin/bash

echo "🔧 CORRECTION DEBUG PUBLICITÉS EN PRODUCTION"
echo "=============================================="

# Construire la nouvelle image avec les logs de debug
echo "📦 Construction de l'image avec debug..."
docker-compose build --no-cache

# Redémarrer le conteneur
echo "🔄 Redémarrage du conteneur..."
docker-compose up -d

# Attendre que le conteneur soit prêt
echo "⏳ Attente du démarrage..."
sleep 10

# Vérifier l'état du conteneur
echo "🔍 Vérification de l'état..."
docker-compose ps

# Afficher les derniers logs
echo "📋 Derniers logs (20 lignes):"
docker-compose logs --tail=20

echo ""
echo "✅ Correction DEBUG appliquée !"
echo "👉 Maintenant, accédez à la page Publicités"
echo "👉 Les logs vont montrer les années stockées en base"
echo "👉 Nous pourrons voir pourquoi le filtre année=2025 ne fonctionne pas"
echo ""
echo "Pour voir les logs en temps réel :"
echo "docker-compose logs -f"