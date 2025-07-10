#!/bin/bash

# LogiFlow Database Backup Script

set -e

# Configuration
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/logiflow_backup_${DATE}.sql"
MAX_BACKUPS=7  # Keep last 7 backups

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_status "Début de la sauvegarde de la base de données LogiFlow..."

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "logiflow-db.*Up"; then
    print_error "Le conteneur de base de données n'est pas en cours d'exécution."
    print_error "Démarrez-le avec: docker-compose up -d postgres"
    exit 1
fi

# Create backup
print_status "Création de la sauvegarde: $BACKUP_FILE"
if docker-compose exec -T postgres pg_dump -U logiflow_admin --clean --if-exists logiflow_db > "$BACKUP_FILE"; then
    print_status "✅ Sauvegarde créée avec succès!"
    
    # Compress the backup
    print_status "Compression de la sauvegarde..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Taille du fichier: $SIZE"
    
    # Clean old backups
    print_status "Nettoyage des anciennes sauvegardes (garde les $MAX_BACKUPS dernières)..."
    cd "$BACKUP_DIR"
    ls -t logiflow_backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
    cd ..
    
    REMAINING=$(ls -1 "$BACKUP_DIR"/logiflow_backup_*.sql.gz 2>/dev/null | wc -l)
    print_status "Sauvegardes conservées: $REMAINING"
    
    print_status "🎉 Sauvegarde terminée avec succès!"
    echo "Fichier: $BACKUP_FILE"
    
else
    print_error "❌ Erreur lors de la création de la sauvegarde"
    exit 1
fi