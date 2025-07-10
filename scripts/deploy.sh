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
    print_warning "⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies valeurs de production !"
    print_warning "   - Changez POSTGRES_PASSWORD"
    print_warning "   - Changez SESSION_SECRET"
    read -p "Appuyez sur Entrée pour continuer une fois que vous avez modifié le fichier .env..."
fi

# Create SSL directory if it doesn't exist
if [ ! -d "ssl" ]; then
    print_status "Création du répertoire SSL..."
    mkdir -p ssl
    
    # Generate self-signed certificate for development
    print_warning "Génération d'un certificat SSL auto-signé pour le développement..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=FR/ST=France/L=Paris/O=LogiFlow/CN=localhost"
    
    print_warning "⚠️  En production, remplacez les certificats SSL par des certificats valides !"
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
    echo "   - HTTP:  http://localhost"
    echo "   - HTTPS: https://localhost"
    echo "   - Direct: http://localhost:5000"
    echo ""
    echo "🔑 Connexion par défaut :"
    echo "   - Identifiant: admin"
    echo "   - Mot de passe: admin"
    echo ""
    echo "📊 Commandes utiles :"
    echo "   - Voir les logs:        docker-compose logs -f"
    echo "   - Arrêter les services: docker-compose down"
    echo "   - Redémarrer:          docker-compose restart"
    echo "   - Base de données:     docker-compose exec postgres psql -U logiflow_user -d logiflow"
    echo ""
    print_warning "⚠️  N'oubliez pas de :"
    print_warning "   1. Changer le mot de passe admin après la première connexion"
    print_warning "   2. Configurer des certificats SSL valides pour la production"
    print_warning "   3. Sauvegarder régulièrement votre base de données"
else
    print_error "❌ Erreur lors du démarrage des services"
    echo "Vérifiez les logs avec: docker-compose logs"
    exit 1
fi