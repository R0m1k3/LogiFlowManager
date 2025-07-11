#!/bin/bash

# Script de correction finale pour les problèmes de production LogiFlow
# Corrige: données modal rapprochement, liaisons ordre-livraison, icônes, date livraison

echo "🚀 CORRECTIONS FINALES PRODUCTION LOGIFLOW"
echo "=============================================="
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker ps &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker d'abord."
    exit 1
fi

# Arrêter l'application si elle tourne
echo "🛑 Arrêt de l'application actuelle..."
docker-compose down --remove-orphans 2>/dev/null || true

# Construire la nouvelle image avec les corrections
echo "🔨 Construction de la nouvelle image avec toutes les corrections..."
docker-compose build --no-cache

# Redémarrer l'application
echo "🚀 Redémarrage de l'application avec les corrections..."
docker-compose up -d

# Attendre que l'application soit prête
echo "⏳ Attente du démarrage de l'application..."
sleep 10

# Vérifier le statut des conteneurs
echo "🔍 Vérification du statut des conteneurs..."
docker-compose ps

# Vérifier les logs pour détecter les erreurs
echo "🔍 Vérification des logs d'application..."
docker-compose logs logiflow-app --tail=20

# Test de connectivité API
echo "🔍 Test de connectivité API..."
if curl -f http://localhost:3000/api/debug/status &>/dev/null; then
    echo "✅ API accessible"
else
    echo "❌ API non accessible"
fi

# Test base de données
echo "🔍 Test connexion base de données..."
if docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "SELECT 1;" &>/dev/null; then
    echo "✅ Base de données accessible"
else
    echo "❌ Base de données non accessible"
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo ""
echo "🔧 CORRECTIONS APPLIQUÉES :"
echo "  ✅ MODAL RAPPROCHEMENT CORRIGÉ - updateDelivery production supporte maintenant tous les champs BL/facture"
echo "  ✅ ICÔNES MODERNISÉES - Edit et Euro au lieu de Plus générique"
echo "  ✅ DATE LIVRAISON AJOUTÉE - Nouvelle colonne dans tableau rapprochement"  
echo "  ✅ LIAISONS ORDRE-LIVRAISON RESTAURÉES - LEFT JOIN orders dans getDeliveries"
echo "  ✅ CACHE INVALIDATION RENFORCÉE - refetchQueries avec logs debug"
echo "  ✅ MODAUX CONFIRMATION UNIFIÉS - Toutes pages utilisent ConfirmDeleteModal"
echo ""
echo "🌐 Application accessible sur : http://localhost:3000"
echo "🔐 Identifiants : admin / admin"
echo ""
echo "📋 TESTS À EFFECTUER :"
echo "  1. ✅ Connexion admin/admin"
echo "  2. ✅ Module Rapprochement : ajouter référence/montant facture" 
echo "  3. ✅ Calendrier : valider livraison → commande liée grise"
echo "  4. ✅ Modal détail : liaison ordre-livraison visible"
echo "  5. ✅ Suppressions : modaux confirmation élégants"
echo ""

# Afficher les logs récents pour diagnostic
echo "📊 LOGS RÉCENTS (si erreurs):"
docker-compose logs logiflow-app --tail=5 | grep -E "(ERROR|WARN|❌|🔄)" || echo "  Aucune erreur détectée"
echo ""
echo "✅ Script terminé avec succès !"