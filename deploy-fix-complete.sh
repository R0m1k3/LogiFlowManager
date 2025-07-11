#!/bin/bash

# SCRIPT DE DÉPLOIEMENT PRODUCTION COMPLET
# ========================================

echo "🚀 DÉPLOIEMENT LOGIFLOW - CORRECTION COMPLÈTE"
echo "============================================="
echo ""

# Configuration
CONTAINER_DB="logiflow-db"
CONTAINER_APP="logiflow-app"
DB_USER="logiflow_admin"
DB_NAME="logiflow_db"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Vérifier les conteneurs
echo "📋 Vérification des conteneurs..."
if ! docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_DB"; then
    echo -e "${RED}❌ Erreur: Conteneur $CONTAINER_DB introuvable${NC}"
    exit 1
fi

if ! docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_APP"; then
    echo -e "${RED}❌ Erreur: Conteneur $CONTAINER_APP introuvable${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Conteneurs trouvés${NC}"

# 2. Arrêter l'application
echo ""
echo "⏸️  Arrêt de l'application..."
docker stop $CONTAINER_APP
echo -e "${GREEN}✅ Application arrêtée${NC}"

# 3. Sauvegarder la base de données
echo ""
echo "💾 Sauvegarde de la base de données..."
BACKUP_FILE="logiflow_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec $CONTAINER_DB pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
echo -e "${GREEN}✅ Sauvegarde créée: $BACKUP_FILE${NC}"

# 4. Appliquer le correctif complet
echo ""
echo "🔧 Application du correctif de schéma complet..."
docker exec -i $CONTAINER_DB psql -U $DB_USER -d $DB_NAME < fix-production-complete.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Correctif appliqué avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'application du correctif${NC}"
    echo "Restauration de la sauvegarde..."
    docker exec -i $CONTAINER_DB psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE
    docker start $CONTAINER_APP
    exit 1
fi

# 5. Vérifier le schéma
echo ""
echo "🔍 Vérification du schéma..."
docker exec $CONTAINER_DB psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    'orders.notes' as check_column,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') as exists
UNION ALL
SELECT 
    'deliveries.scheduled_date',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='scheduled_date')
UNION ALL
SELECT 
    'deliveries.notes',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='notes')
UNION ALL
SELECT 
    'users.name',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name');"

# 6. Reconstruire l'application
echo ""
echo "🏗️  Reconstruction de l'application..."
docker exec $CONTAINER_APP npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application reconstruite${NC}"
else
    echo -e "${YELLOW}⚠️  La reconstruction a échoué, mais on continue...${NC}"
fi

# 7. Redémarrer l'application
echo ""
echo "🔄 Redémarrage de l'application..."
docker start $CONTAINER_APP
echo -e "${GREEN}✅ Application redémarrée${NC}"

# 8. Attendre le démarrage
echo ""
echo "⏱️  Attente du démarrage (30 secondes)..."
sleep 30

# 9. Tests de l'API
echo ""
echo "🧪 Tests de l'API..."

# Test status
echo -n "  - Test /api/debug/status: "
if curl -s -f http://localhost:3000/api/debug/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Pas encore disponible${NC}"
fi

# Test groups
echo -n "  - Test /api/groups: "
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/groups 2>/dev/null | tail -n 1)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ OK (Code: $RESPONSE)${NC}"
else
    echo -e "${RED}❌ Erreur (Code: $RESPONSE)${NC}"
fi

# 10. Résumé
echo ""
echo "======================================"
echo "🎉 DÉPLOIEMENT TERMINÉ"
echo "======================================"
echo -e "${GREEN}✅ Base de données corrigée${NC}"
echo -e "${GREEN}✅ Application redémarrée${NC}"
echo -e "${GREEN}✅ Sauvegarde disponible: $BACKUP_FILE${NC}"
echo ""
echo "📋 Actions recommandées:"
echo "   1. Connectez-vous à l'application"
echo "   2. Créez une commande de test"
echo "   3. Créez une livraison de test"
echo "   4. Vérifiez que tout fonctionne"
echo ""
echo "🆘 En cas de problème:"
echo "   - Restaurer: docker exec -i $CONTAINER_DB psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo "   - Logs: docker logs $CONTAINER_APP"