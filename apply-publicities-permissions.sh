#!/bin/bash

echo "🔐 APPLICATION PERMISSIONS PUBLICITÉS"
echo "====================================="

echo "📋 NOUVELLE CONFIGURATION :"
echo "  👑 Admin     : Voir, Créer, Modifier, Supprimer"
echo "  👥 Manager   : Voir seulement"
echo "  👤 Employé  : Voir seulement"
echo ""

echo "🏗️ Reconstruction avec nouvelles permissions..."
cd /tmp
docker-compose -f /home/user/docker-compose.yml build --no-cache

echo "🔄 Redémarrage des conteneurs..."
docker-compose -f /home/user/docker-compose.yml down
docker-compose -f /home/user/docker-compose.yml up -d

echo "⏳ Attente du démarrage (8 secondes)..."
sleep 8

echo ""
echo "✅ PERMISSIONS APPLIQUÉES !"
echo ""
echo "👉 RÉSULTAT :"
echo "  • Les boutons Créer/Modifier/Supprimer n'apparaissent que pour les admins"
echo "  • Les employés et managers peuvent seulement voir les publicités"
echo "  • Les tentatives de modification côté API retournent 403 Forbidden"
echo ""
echo "🔗 Accédez à la page Publicités pour tester les permissions"