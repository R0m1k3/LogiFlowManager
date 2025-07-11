#!/bin/bash

echo "🔧 CORRECTION ANNÉES PUBLICITÉS PRODUCTION"
echo "=========================================="

echo "🏗️ Reconstruction de l'application avec correction année..."
cd /tmp
docker-compose -f /home/user/docker-compose.yml build --no-cache

echo "🔄 Redémarrage des conteneurs..."
docker-compose -f /home/user/docker-compose.yml down
docker-compose -f /home/user/docker-compose.yml up -d

echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10

echo "✅ CORRECTION APPLIQUÉE !"
echo ""
echo "👉 MAINTENANT :"
echo "1. Accédez à la page Publicités - elle démarre sur 2024"
echo "2. Vos publicités devraient maintenant être visibles"
echo "3. Le dashboard affiche les publicités de 2024 et 2025"
echo ""
echo "Si le problème persiste, les publicités sont peut-être dans une autre année."
echo "Changez l'année dans le filtre pour voir toutes les données."