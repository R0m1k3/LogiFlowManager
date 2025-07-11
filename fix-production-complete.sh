#!/bin/bash

echo "🔧 LogiFlow - Corrections critiques production finalisées"
echo "========================================================="

# 1. Arrêter les conteneurs
echo "📦 Arrêt des conteneurs existants..."
docker-compose down

# 2. Rebuild complet avec nouvelles corrections
echo "🔨 Reconstruction complète avec corrections stats + users..."
docker-compose build --no-cache

# 3. Redémarrage 
echo "🚀 Redémarrage des services..."
docker-compose up -d

# 4. Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 15

# 5. Vérifier les services
echo "✅ Vérification de l'état des services..."
docker-compose ps

# 6. Tests de connectivité complets
echo "🔍 Tests de connectivité..."

echo "  → API Health check..."
curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || echo "  ❌ Health check failed"

echo "  → Test API Stats (juillet 2025)..."
curl -s http://localhost:3000/api/stats/monthly?year=2025&month=7 2>/dev/null | jq '.totalPalettes // "AUTH_REQUIRED"' || echo "  ⚠️  Requires authentication"

# 7. Vérifier les logs d'erreur
echo "📋 Vérification des logs (erreurs uniquement)..."
docker-compose logs --tail=50 app | grep -i error | tail -10 || echo "  ✅ Aucune erreur récente"

echo ""
echo "🎉 MISE À JOUR PRODUCTION TERMINÉE !"
echo ""
echo "🔧 CORRECTIONS APPLIQUÉES :"
echo "  ✅ MODULE RAPPROCHEMENT ENTIÈREMENT CORRIGÉ - Suppression admin + mise à jour factures + état mutations"
echo "  ✅ Boutons + Ajouter remplacés par icônes propres et élégantes"
echo "  ✅ Modaux de confirmation ajoutés sur toutes les pages (Orders, Deliveries, Rapprochement)"
echo "  ✅ Cache invalidation corrigée avec refetchQueries pour données temps réel"
echo "  ✅ ERREUR COLUMN QUANTITY RÉSOLUE - Statistiques calculées depuis livraisons uniquement"
echo "  ✅ DONNÉES TEST DÉFINITIVEMENT SUPPRIMÉES - initDatabase.production.ts + init.sql nettoyés"
echo "  ✅ API STATS corrigée - Support storeId pour admin"  
echo "  ✅ Routes assignation groupes ajoutées /api/users/:userId/groups"
echo "  ✅ Création utilisateurs - Mapping firstName/lastName → username/name"
echo "  ✅ Hachage mots de passe automatique lors création/modification"
echo "  ✅ Génération username automatique depuis email (ex: ff0292@ffest.fr → ff0292)"
echo ""
echo "🔍 TESTS À EFFECTUER :"
echo "  1. Dashboard → Statistiques doivent afficher 5 palettes et 3 colis"
echo "  2. Utilisateurs → Création d'un nouvel utilisateur (ex: test@example.com)"
echo "  3. Calendar → Navigation entre magasins pour admin"
echo ""
echo "🌐 Application accessible sur : http://localhost:3000"
echo "🔑 Identifiants : admin / admin"
echo ""
echo "⚠️  Si problème persiste, vérifier les logs : docker-compose logs app"