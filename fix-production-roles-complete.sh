#!/bin/bash

echo "🔧 CORRECTION COMPLÈTE DES RÔLES EN PRODUCTION"
echo "=============================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 ÉTAT ACTUEL DES RÔLES EN PRODUCTION:${NC}"
echo "======================================="

# Vérification que le conteneur est en cours d'exécution
if ! docker ps | grep -q "logiflow"; then
    echo -e "${RED}❌ Le conteneur LogiFlow n'est pas en cours d'exécution${NC}"
    echo "Veuillez démarrer l'application avec: docker-compose up -d"
    exit 1
fi

# Récupérer l'état actuel des rôles
echo -e "${YELLOW}🔍 Vérification des rôles actuels...${NC}"
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
\echo 'ÉTAT ACTUEL:'
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;
EOF

echo ""
echo -e "${BLUE}🔧 APPLICATION DES CORRECTIONS...${NC}"
echo "================================="

# Appliquer les corrections des couleurs
echo -e "${YELLOW}📝 Correction des couleurs et noms d'affichage...${NC}"
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
-- Corriger les couleurs des rôles selon les spécifications
UPDATE roles SET color = '#dc2626', display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb', display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a', display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed', display_name = 'Directeur' WHERE name = 'directeur';

\echo 'CORRECTIONS APPLIQUÉES'
EOF

echo ""
echo -e "${BLUE}✅ VÉRIFICATION DES RÉSULTATS:${NC}"
echo "=============================="

# Vérifier les corrections
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
\echo 'RÔLES APRÈS CORRECTION:'
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

\echo ''
\echo 'ASSIGNATIONS UTILISATEURS:'
SELECT 
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.display_name,
  r.color
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
ORDER BY ur.user_id;
EOF

echo ""
echo -e "${GREEN}🎉 CORRECTION TERMINÉE !${NC}"
echo "======================="
echo ""
echo -e "${YELLOW}📋 COULEURS ATTENDUES:${NC}"
echo "• Administrateur: ${RED}#dc2626 (Rouge)${NC}"
echo "• Manager: ${BLUE}#2563eb (Bleu)${NC}"
echo "• Employé: ${GREEN}#16a34a (Vert)${NC}"
echo "• Directeur: #7c3aed (Violet)"
echo ""
echo -e "${YELLOW}🔄 REDÉMARRAGE RECOMMANDÉ:${NC}"
echo "Pour appliquer les changements dans l'interface:"
echo "docker-compose restart logiflow-app"
echo ""
echo -e "${GREEN}✅ La gestion des rôles est maintenant centralisée dans Administration > Gestion des Rôles${NC}"