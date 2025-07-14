#!/bin/bash

# LogiFlow Production Deployment Script
# Script de déploiement automatique pour production

set -e

echo "========================================"
echo "LogiFlow - Déploiement Production"
echo "========================================"

# Configuration
CONTAINER_NAME="logiflow-app"
DB_CONTAINER_NAME="logiflow-postgres"
NETWORK_NAME="nginx_default"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage coloré
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Vérifier que les fichiers nécessaires existent
required_files=("docker-compose.yml" "Dockerfile" "init.sql" "migration-production.sql")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Fichier requis manquant: $file"
        exit 1
    fi
done

print_status "Tous les fichiers requis sont présents"

# Créer le réseau externe si nécessaire
print_status "Vérification du réseau Docker..."
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    print_warning "Réseau $NETWORK_NAME non trouvé, création..."
    docker network create "$NETWORK_NAME" || {
        print_error "Impossible de créer le réseau $NETWORK_NAME"
        exit 1
    }
    print_status "Réseau $NETWORK_NAME créé avec succès"
else
    print_status "Réseau $NETWORK_NAME déjà présent"
fi

# Arrêter les conteneurs existants
print_status "Arrêt des conteneurs existants..."
docker-compose down --remove-orphans 2>/dev/null || true

# Supprimer les images obsolètes
print_status "Nettoyage des images obsolètes..."
docker image prune -f --filter "label=project=logiflow" 2>/dev/null || true

# Construire et démarrer les services
print_status "Construction et démarrage des services..."
docker-compose build --no-cache
docker-compose up -d

# Attendre que la base de données soit prête
print_status "Attente de l'initialisation de la base de données..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U logiflow_admin -d logiflow_db >/dev/null 2>&1; then
        print_status "Base de données prête"
        break
    fi
    
    attempt=$((attempt + 1))
    print_status "Tentative $attempt/$max_attempts - Attente de la base de données..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Timeout lors de l'attente de la base de données"
    docker-compose logs postgres
    exit 1
fi

# Attendre que l'application soit prête
print_status "Attente de l'initialisation de l'application..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_status "Application prête"
        break
    fi
    
    attempt=$((attempt + 1))
    print_status "Tentative $attempt/$max_attempts - Attente de l'application..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Timeout lors de l'attente de l'application"
    docker-compose logs logiflow-app
    exit 1
fi

# Vérifier le statut final
print_status "Vérification du déploiement..."

# Test API Health
health_response=$(curl -s http://localhost:3000/api/health || echo "ERROR")
if echo "$health_response" | grep -q "healthy"; then
    print_status "✓ API Health check: OK"
else
    print_error "✗ API Health check: FAILED"
    echo "Response: $health_response"
fi

# Test de la base de données
if docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "✓ Base de données: OK"
else
    print_error "✗ Base de données: FAILED"
fi

# Afficher les informations de déploiement
echo ""
echo "========================================"
echo "DÉPLOIEMENT TERMINÉ"
echo "========================================"
echo "Application URL: http://localhost:3000"
echo "Base de données: Port 5434 (externe)"
echo "Authentification: admin / admin"
echo ""
echo "Conteneurs actifs:"
docker-compose ps
echo ""
echo "Logs disponibles avec:"
echo "  docker-compose logs -f logiflow-app"
echo "  docker-compose logs -f postgres"
echo ""

# Optionnel: Afficher les logs récents
if [ "$1" = "--logs" ]; then
    print_status "Affichage des logs récents..."
    docker-compose logs --tail=50
fi

print_status "Déploiement production terminé avec succès!"