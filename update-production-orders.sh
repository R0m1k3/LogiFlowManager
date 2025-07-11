#!/bin/bash

# Script pour appliquer les corrections des liaisons commande-livraison en production

echo "🚀 CORRECTION LIAISONS COMMANDE-LIVRAISON PRODUCTION"
echo "====================================================="
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker ps &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution."
    exit 1
fi

# Arrêter l'application
echo "🛑 Arrêt de l'application..."
docker-compose down --remove-orphans 2>/dev/null || true

# Reconstruire avec les corrections
echo "🔨 Reconstruction avec corrections liaisons ordre-livraison..."
docker-compose build --no-cache

# Redémarrer
echo "🚀 Redémarrage de l'application..."
docker-compose up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage..."
sleep 10

# Vérifier les logs
echo "🔍 Vérification des logs..."
docker-compose logs logiflow-app --tail=10

echo ""
echo "✅ CORRECTIONS APPLIQUÉES :"
echo "  🔗 validateDelivery met à jour le statut de la commande liée"
echo "  🔗 createDelivery met à jour le statut de la commande à 'planned'"
echo "  🔗 LEFT JOIN orders ajouté dans toutes les requêtes deliveries"
echo "  🔗 Champs order relationnels disponibles dans les modaux"
echo "  🎨 Favicon LogiFlow ajouté (camion logistique bleu)"
echo ""
echo "🌐 Application : http://localhost:3000"
echo "🔐 Login : admin / admin"
echo ""
echo "📋 TESTS À EFFECTUER :"
echo "  1. Créer commande → Créer livraison liée"
echo "  2. Valider livraison → Commande devient 'delivered'"
echo "  3. Vérifier liaisons visibles dans modaux détail"
echo "  4. Favicon visible dans onglet navigateur"