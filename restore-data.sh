#!/bin/bash

# Script pour restaurer les données depuis une sauvegarde

echo "🔄 Restauration des données LogiFlow..."

# Vérifier qu'un fichier de sauvegarde est fourni
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <fichier_sauvegarde.sql>"
    echo "Exemple: $0 backup_20250114_163045.sql"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

# Vérifier que les conteneurs sont en cours d'exécution
if ! docker-compose ps | grep -q "logiflow-db"; then
    echo "❌ Base de données non démarrée. Lancez d'abord: docker-compose up -d"
    exit 1
fi

echo "💾 Restauration depuis: $BACKUP_FILE"

# Restaurer les données
echo "🔄 Restoration en cours..."
docker-compose exec -T logiflow-db psql -U logiflow_admin logiflow_db < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauration terminée avec succès!"
    echo "🔄 Redémarrage de l'application..."
    docker-compose restart logiflow-app
    
    echo "⏳ Attente de l'initialisation..."
    sleep 10
    
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo "✅ Application restaurée avec succès!"
        echo "🌐 Accessible sur: http://localhost:3000"
    else
        echo "⚠️ Application redémarrée mais vérifiez les logs"
        docker-compose logs --tail=10 logiflow-app
    fi
else
    echo "❌ Erreur lors de la restauration"
    exit 1
fi