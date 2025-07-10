#!/bin/bash

# Script pour configurer et publier l'image Docker sur GitHub Container Registry

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Variables
GITHUB_USERNAME=""
GITHUB_REPO=""
IMAGE_TAG="latest"

echo "🚀 Configuration GitHub Container Registry pour LogiFlow"
echo ""

# Demander les informations GitHub
read -p "Votre nom d'utilisateur GitHub: " GITHUB_USERNAME
read -p "Nom du repository (ex: logiflow): " GITHUB_REPO

if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_REPO" ]; then
    print_error "Nom d'utilisateur et repository requis"
    exit 1
fi

IMAGE_NAME="ghcr.io/${GITHUB_USERNAME}/${GITHUB_REPO}"

print_status "Configuration:"
echo "  - Username: $GITHUB_USERNAME"
echo "  - Repository: $GITHUB_REPO"
echo "  - Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé"
    exit 1
fi

# Build de l'image localement
print_status "🔨 Build de l'image Docker..."
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

if [ $? -eq 0 ]; then
    print_success "Image buildée avec succès"
else
    print_error "Échec du build"
    exit 1
fi

# Instructions pour la publication
echo ""
print_status "📋 Étapes suivantes pour publier sur GitHub:"
echo ""
echo "1. Créer un Personal Access Token GitHub:"
echo "   - Aller sur GitHub > Settings > Developer settings > Personal access tokens"
echo "   - Créer un token avec permissions 'write:packages'"
echo ""
echo "2. Se connecter au registry:"
echo "   docker login ghcr.io -u $GITHUB_USERNAME"
echo "   (utiliser le token comme mot de passe)"
echo ""
echo "3. Publier l'image:"
echo "   docker push $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "4. Mettre à jour vos fichiers Docker Compose:"

# Mise à jour automatique des fichiers
print_status "🔧 Mise à jour des fichiers de configuration..."

# Mise à jour docker-compose.production.yml
sed -i.bak "s|ghcr.io/username/logiflow:latest|$IMAGE_NAME:$IMAGE_TAG|g" docker-compose.production.yml
sed -i.bak "s|# image: ghcr.io/username/logiflow:latest|image: $IMAGE_NAME:$IMAGE_TAG|g" docker-compose.production.yml
sed -i.bak "s|build:|# build:|g" docker-compose.production.yml
sed -i.bak "s|context: \.|# context: \.|g" docker-compose.production.yml
sed -i.bak "s|dockerfile: Dockerfile|# dockerfile: Dockerfile|g" docker-compose.production.yml
sed -i.bak "s|target: production|# target: production|g" docker-compose.production.yml

# Mise à jour portainer-stack.yml
sed -i.bak "s|ghcr.io/username/logiflow:latest|$IMAGE_NAME:$IMAGE_TAG|g" portainer-stack.yml
sed -i.bak "s|# image: ghcr.io/username/logiflow:latest|image: $IMAGE_NAME:$IMAGE_TAG|g" portainer-stack.yml

# Mise à jour GitHub Actions
sed -i.bak "s|\${{ github.repository }}|${GITHUB_USERNAME}/${GITHUB_REPO}|g" .github/workflows/docker-build.yml

print_success "Fichiers mis à jour avec votre configuration"

echo ""
print_status "📁 Fichiers modifiés:"
echo "  - docker-compose.production.yml"
echo "  - portainer-stack.yml"
echo "  - .github/workflows/docker-build.yml"

echo ""
print_warning "Une fois l'image publiée sur GitHub, vous pourrez utiliser:"
echo "  docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "Pour les mises à jour via Portainer:"
echo "  - Stack > Edit > Deploy"
echo "  - Ou utiliser Watchtower pour auto-update"

echo ""
print_success "🎉 Configuration terminée !"