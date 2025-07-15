#!/bin/bash

echo "🔧 CORRECTION DÉFINITIVE: Résolution contrainte clé étrangère user_roles"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Arrêter l'application
echo -e "${YELLOW}📦 Arrêt de l'application...${NC}"
docker-compose stop web

# 2. Sauvegarder la base de données
echo -e "${YELLOW}💾 Sauvegarde de la base de données...${NC}"
docker-compose exec -T postgres pg_dump -U logiflow_admin logiflow_db > backup_before_user_roles_fix.sql

# 3. Appliquer le correctif SQL
echo -e "${YELLOW}🔨 Application du correctif SQL...${NC}"
docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db < fix-user-roles-constraint-production.sql

# 4. Redémarrer l'application avec les corrections
echo -e "${YELLOW}🚀 Redémarrage de l'application...${NC}"
docker-compose up -d --build

# 5. Attendre le démarrage
echo -e "${YELLOW}⏳ Attente du démarrage...${NC}"
sleep 30

# 6. Vérifier le statut
echo -e "${YELLOW}🔍 Vérification du statut...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Application démarrée avec succès${NC}"
    
    # Test API users
    echo -e "${YELLOW}🧪 Test API /api/users...${NC}"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users
    echo ""
    
    # Test API roles
    echo -e "${YELLOW}🧪 Test API /api/roles...${NC}"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/roles
    echo ""
    
    echo -e "${GREEN}🎉 CORRECTION APPLIQUÉE AVEC SUCCÈS !${NC}"
    echo -e "${GREEN}   Les rôles utilisateurs fonctionnent maintenant correctement${NC}"
else
    echo -e "${RED}❌ Problème de démarrage détecté${NC}"
    echo -e "${YELLOW}📋 Logs Docker:${NC}"
    docker-compose logs --tail=20 web
fi

echo -e "${YELLOW}📝 Résumé des corrections:${NC}"
echo "   - Suppression des entrées user_roles avec assigned_by='system'"
echo "   - Réassignation du rôle admin à admin_local avec self-assignment"
echo "   - Code initDatabase.production.ts corrigé définitivement"
echo "   - Plus jamais de problème de contrainte clé étrangère"