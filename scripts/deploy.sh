#!/bin/bash

# LogiFlow Production Deployment Script

set -e

echo "🚀 Déploiement de LogiFlow en production"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning "Fichier .env non trouvé. Création à partir de .env.example..."
    cp .env.example .env
    print_status "✅ Fichier .env créé avec des identifiants préconfigurés"
fi

# Vérifier si le réseau nginx_default existe
if ! docker network ls | grep -q "nginx_default"; then
    print_warning "Réseau nginx_default non trouvé. Création du réseau..."
    docker network create nginx_default
    print_status "✅ Réseau nginx_default créé"
fi

# Build the application
print_status "Construction de l'image Docker..."
docker-compose build --no-cache

# Stop existing containers
print_status "Arrêt des conteneurs existants..."
docker-compose down

# Start the services
print_status "Démarrage des services..."
docker-compose up -d

# Wait for services to be ready
print_status "Attente du démarrage des services..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services démarrés avec succès !"
    echo ""
    echo "🌐 Application disponible sur :"
    echo "   - Application: http://localhost:5000"
    echo ""
    echo "🔑 Connexion par défaut :"
    echo "   - Identifiant: admin"
    echo "   - Mot de passe: admin"
    echo ""
    echo "🗄️  Base de données :"
    echo "   - Hôte: localhost:5434"
    echo "   - Base: logiflow_db"
    echo "   - Utilisateur: logiflow_admin"
    echo "   - Mot de passe: LogiFlow2025!"
    echo ""
    echo "📊 Commandes utiles :"
    echo "   - Voir les logs:        docker-compose logs -f"
    echo "   - Arrêter les services: docker-compose down"
    echo "   - Redémarrer:          docker-compose restart"
    echo "   - Base de données:     docker-compose exec postgres psql -U logiflow_admin -d logiflow_db"
    echo ""
    print_warning "⚠️  N'oubliez pas de :"
    print_warning "   1. Changer le mot de passe admin après la première connexion"
    print_warning "   2. Sauvegarder régulièrement votre base de données"
else
    print_error "❌ Erreur lors du démarrage des services"
    echo "Vérifiez les logs avec: docker-compose logs"
    exit 1
fi