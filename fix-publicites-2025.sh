#!/bin/bash

echo "🔧 CORRECTION ANNÉE PUBLICITÉS → 2025"
echo "===================================="

echo "🏗️ Reconstruction avec corrections..."
cd /tmp
docker-compose -f /home/user/docker-compose.yml build --no-cache

echo "🔄 Redémarrage conteneurs..."
docker-compose -f /home/user/docker-compose.yml down
docker-compose -f /home/user/docker-compose.yml up -d

echo "⏳ Attente démarrage (8 secondes)..."
sleep 8

echo "📋 Mise à jour des publicités vers 2025..."
docker-compose -f /home/user/docker-compose.yml exec -T postgres psql -U logiflow_admin -d logiflow_db -c "
UPDATE publicities SET year = 2025 WHERE year = 2024;
SELECT id, pub_number, year FROM publicities ORDER BY id;
"

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo "👉 Vos publicités sont maintenant dans le plan pub 2025"
echo "👉 Accédez à la page Publicités avec l'année 2025 sélectionnée"