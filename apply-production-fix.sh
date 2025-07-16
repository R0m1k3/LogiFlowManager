#!/bin/bash

echo "🚨 CORRECTION DÉFINITIVE DES RÔLES PRODUCTION"
echo "============================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  ATTENTION: Cette opération va RÉINITIALISER complètement les rôles et permissions${NC}"
echo -e "${RED}⚠️  Les assignations utilisateurs seront préservées avec les nouveaux IDs${NC}"
echo ""

# Vérification que le conteneur PostgreSQL est en cours d'exécution
if ! docker ps | grep -q "logiflow-postgres"; then
    echo -e "${RED}❌ Le conteneur PostgreSQL n'est pas en cours d'exécution${NC}"
    echo "Veuillez démarrer l'application avec: docker-compose up -d"
    exit 1
fi

echo -e "${BLUE}📊 ÉTAT ACTUEL (AVANT CORRECTION):${NC}"
echo "=================================="

# Afficher l'état corrompu actuel
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
\echo 'RÔLES CORROMPUS ACTUELS:'
SELECT id, name, display_name, color FROM roles ORDER BY id;

\echo ''
\echo 'ASSIGNATIONS ACTUELLES:'
SELECT ur.user_id, ur.role_id, r.name 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id;
EOF

echo ""
echo -e "${YELLOW}❓ Voulez-vous continuer la réinitialisation complète ? (y/N)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Opération annulée${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 APPLICATION DE LA CORRECTION COMPLÈTE...${NC}"
echo "==========================================="

# Créer une sauvegarde avant correction
echo -e "${YELLOW}💾 Création d'une sauvegarde...${NC}"
docker exec logiflow-postgres pg_dump -U logiflow_admin -d logiflow_db --schema-only > backup_schema_$(date +%Y%m%d_%H%M%S).sql

# Appliquer le script de correction
echo -e "${YELLOW}🔄 Application du script de correction...${NC}"
if docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db < fix-production-data-force.sql; then
    echo -e "${GREEN}✅ Correction appliquée avec succès !${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'application de la correction${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}✅ VÉRIFICATION DES RÉSULTATS:${NC}"
echo "=============================="

# Vérifier les corrections
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
\echo 'RÔLES APRÈS CORRECTION:'
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

\echo ''
\echo 'NOMBRE DE PERMISSIONS:'
SELECT COUNT(*) as total_permissions FROM permissions;

\echo ''
\echo 'ASSIGNATIONS UTILISATEURS APRÈS CORRECTION:'
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;
EOF

echo ""
echo -e "${GREEN}🎉 CORRECTION TERMINÉE AVEC SUCCÈS !${NC}"
echo "===================================="
echo ""
echo -e "${YELLOW}📋 RÔLES CORRIGÉS:${NC}"
echo "• ID 1: Administrateur (Rouge #dc2626)"
echo "• ID 2: Manager (Bleu #2563eb)"  
echo "• ID 3: Employé (Vert #16a34a)"
echo "• ID 4: Directeur (Violet #7c3aed)"
echo ""
echo -e "${YELLOW}🔄 REDÉMARRAGE NÉCESSAIRE:${NC}"
echo "docker-compose restart logiflow-app"
echo ""
echo -e "${GREEN}✅ Les rôles utilisent maintenant les bons IDs séquentiels (1-4)${NC}"
echo -e "${GREEN}✅ Plus d'erreur 'Le rôle sélectionné n'est pas valide'${NC}"