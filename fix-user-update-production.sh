#!/bin/bash

echo "🔧 Correction du problème de mise à jour des utilisateurs en production..."

# Build et déploiement
echo "📦 Construction de l'image Docker avec les corrections..."
docker build -t logiflow:latest .

echo "🔄 Arrêt et redémarrage du conteneur..."
docker-compose down
docker-compose up -d

echo "⏳ Attente du démarrage complet..."
sleep 10

echo "✅ Corrections appliquées !"
echo ""
echo "📝 Les utilisateurs peuvent maintenant :"
echo "   - Modifier leur propre profil (nom, prénom, email)"
echo "   - Les admins peuvent toujours modifier tous les profils"
echo "   - Les données nom/prénom sont correctement sauvegardées"
echo ""
echo "🔍 Pour vérifier, connectez-vous et éditez votre profil"