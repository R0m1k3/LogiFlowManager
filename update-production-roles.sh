#!/bin/bash

# Script de mise à jour production avec système de gestion des rôles complet
# Inclut toutes les fonctionnalités récentes

echo "🚀 Mise à jour production avec système de gestion des rôles complet..."

# 1. Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# 2. Supprimer les images existantes pour forcer la reconstruction
echo "🗑️ Suppression des anciennes images..."
docker-compose down --rmi all --volumes --remove-orphans

# 3. Reconstruction complète
echo "🔨 Reconstruction de l'application..."
docker-compose build --no-cache

# 4. Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose up -d

# 5. Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 15

# 6. Attendre que l'application soit prête
echo "⏳ Attente de l'application..."
sleep 10

# 7. Vérifications
echo "🔍 Vérifications du déploiement..."

# Vérifier que les conteneurs sont en cours d'exécution
if docker-compose ps | grep -q "Up"; then
    echo "✅ Conteneurs en cours d'exécution"
else
    echo "❌ Erreur: Conteneurs non démarrés"
    docker-compose logs --tail=50
    exit 1
fi

# Vérifier l'API
echo "🔍 Vérification de l'API..."
sleep 5

# Test de l'API de base
if curl -s -f http://localhost:3000/api/debug/status > /dev/null; then
    echo "✅ API opérationnelle"
else
    echo "❌ Erreur: API non accessible"
    docker-compose logs app --tail=20
    exit 1
fi

# Test de la base de données
echo "🔍 Vérification de la base de données..."
if curl -s -f http://localhost:3000/api/debug/db > /dev/null; then
    echo "✅ Base de données opérationnelle"
else
    echo "❌ Erreur: Base de données non accessible"
    docker-compose logs postgres --tail=20
    exit 1
fi

# 8. Vérifier les nouvelles fonctionnalités
echo "🔍 Vérification des nouvelles fonctionnalités..."

# Vérifier l'API des rôles
if curl -s -f http://localhost:3000/api/roles > /dev/null; then
    echo "✅ API Rôles disponible"
else
    echo "⚠️  API Rôles non accessible (peut nécessiter authentification)"
fi

# Vérifier l'API des permissions
if curl -s -f http://localhost:3000/api/permissions > /dev/null; then
    echo "✅ API Permissions disponible"
else
    echo "⚠️  API Permissions non accessible (peut nécessiter authentification)"
fi

# 9. Afficher les informations de connexion
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "📍 Informations de connexion:"
echo "   URL: http://localhost:3000"
echo "   Utilisateur: admin"
echo "   Mot de passe: admin"
echo ""
echo "🆕 Nouvelles fonctionnalités déployées:"
echo "   ✅ Système de gestion des rôles dynamique complet"
echo "   ✅ Permissions calendrier (read, create, update, delete)"
echo "   ✅ Mise en évidence date actuelle dans le calendrier"
echo "   ✅ Affichage amélioré des publicités dashboard"
echo "   ✅ Interface utilisateur modernisée"
echo "   ✅ Toutes les corrections de bugs récentes"
echo ""
echo "🛠️ Gestion des rôles:"
echo "   - Accédez à 'Gestion des Rôles' dans le menu"
echo "   - Créez des rôles personnalisés"
echo "   - Configurez les permissions par module"
echo "   - Assignez les rôles aux utilisateurs"
echo ""
echo "📊 Monitoring:"
echo "   - Logs: docker-compose logs -f app"
echo "   - Statut: docker-compose ps"
echo "   - Métriques: http://localhost:3000/api/metrics"
echo ""

# 10. Vérification finale des logs
echo "📋 Derniers logs (pour vérification):"
echo "----------------------------------------"
docker-compose logs app --tail=10
echo "----------------------------------------"

echo "✅ Mise à jour production terminée!"