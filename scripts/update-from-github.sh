#!/bin/bash

# Script de mise à jour via GitHub Container Registry
# Usage: ./scripts/update-from-github.sh [tag]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
IMAGE_TAG=${1:-latest}
GITHUB_REGISTRY="ghcr.io"

print_status "🚀 Mise à jour LogiFlow depuis GitHub Container Registry"
echo "Image tag: $IMAGE_TAG"
echo ""

# Vérification des prérequis
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé ou accessible"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé ou accessible"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Fichier $COMPOSE_FILE introuvable"
    print_status "Utilisation du fichier docker-compose.yml standard"
    COMPOSE_FILE="docker-compose.yml"
fi

# Sauvegarde des données
print_status "📦 Sauvegarde des volumes de données..."
docker-compose -f $COMPOSE_FILE exec postgres pg_dump -U logiflow_admin logiflow_db > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || print_warning "Impossible de créer la sauvegarde (service non démarré?)"

# Arrêt des services
print_status "🛑 Arrêt des services actuels..."
docker-compose -f $COMPOSE_FILE down

# Mise à jour de l'image
print_status "📥 Téléchargement de la nouvelle image..."
if [[ $COMPOSE_FILE == *"production"* ]]; then
    # Pour le fichier de production, on pull directement l'image configurée
    IMAGE_NAME=$(grep "image:" $COMPOSE_FILE | head -1 | awk '{print $2}' | sed "s/:.*/:$IMAGE_TAG/")
    docker pull $IMAGE_NAME
else
    print_warning "Mode développement détecté, reconstruction de l'image locale"
    docker-compose -f $COMPOSE_FILE build --no-cache
fi

# Nettoyage des anciennes images
print_status "🧹 Nettoyage des anciennes images..."
docker image prune -f

# Redémarrage des services
print_status "🔄 Redémarrage des services..."
docker-compose -f $COMPOSE_FILE up -d

# Attente du démarrage
print_status "⏳ Attente du démarrage des services..."
sleep 10

# Vérification de l'état
print_status "🔍 Vérification de l'état des services..."
if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    print_success "✅ Services démarrés avec succès !"
    echo ""
    echo "🌐 Application mise à jour disponible sur :"
    echo "   - Application: http://localhost:5001"
    echo "   - Base de données: localhost:5434"
    echo ""
    echo "🔑 Connexion par défaut :"
    echo "   - Identifiant: admin"
    echo "   - Mot de passe: admin"
    
    # Test de santé
    print_status "🏥 Test de santé de l'application..."
    sleep 5
    if curl -f http://localhost:5001/api/health >/dev/null 2>&1; then
        print_success "Application opérationnelle !"
    else
        print_warning "Application en cours de démarrage, patientez quelques instants"
    fi
else
    print_error "❌ Erreur lors du démarrage des services"
    print_status "Vérification des logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=20
    exit 1
fi

echo ""
print_success "🎉 Mise à jour terminée avec succès !"
echo ""
echo "📋 Commandes utiles :"
echo "   - Voir les logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   - Redémarrer: docker-compose -f $COMPOSE_FILE restart"
echo "   - Arrêter: docker-compose -f $COMPOSE_FILE down"