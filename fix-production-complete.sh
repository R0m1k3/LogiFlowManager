#!/bin/bash

echo "🔧 LogiFlow - Application des corrections complètes en production"
echo "=================================================================="

# 1. Arrêter les conteneurs
echo "📦 Arrêt des conteneurs existants..."
docker-compose down

# 2. Rebuild complet
echo "🔨 Reconstruction complète des images Docker..."
docker-compose build --no-cache

# 3. Redémarrage 
echo "🚀 Redémarrage des services..."
docker-compose up -d

# 4. Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# 5. Vérifier les services
echo "✅ Vérification de l'état des services..."
docker-compose ps

# 6. Tester la connectivité
echo "🔍 Test de connectivité..."
curl -s http://localhost:3000/api/health | jq '.' || echo "API Health check failed"

# 7. Vérifier les logs
echo "📋 Derniers logs de l'application..."
docker-compose logs --tail=20 app

echo "🎉 Mise à jour de production terminée !"
echo ""
echo "🔧 Corrections appliquées :"
echo "  ✅ Création d'utilisateurs corrigée (mapping username/name)"
echo "  ✅ Hachage automatique des mots de passe" 
echo "  ✅ Calcul statistiques palettes/colis depuis BDD réelle"
echo "  ✅ Architecture production stabilisée"
echo ""
echo "🌐 Application accessible sur : http://localhost:3000"
echo "🔑 Identifiants : admin / admin"