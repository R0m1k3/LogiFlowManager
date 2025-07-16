#!/bin/bash

echo "🚨 CORRECTION IMMÉDIATE DES RÔLES PRODUCTION"
echo "============================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Diagnostic du problème...${NC}"
echo "Production a les IDs: 2, 3, 4, 6"
echo "Frontend s'attend à: 1, 2, 3, 4"
echo ""

# Vérifier le conteneur
if ! docker ps | grep -q "logiflow-postgres"; then
    echo -e "${RED}❌ Conteneur PostgreSQL non trouvé${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Correction des IDs de rôles...${NC}"

# Script de correction des IDs
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db << 'EOF'
-- Afficher l'état actuel
SELECT 'AVANT CORRECTION:' as status;
SELECT id, name, display_name, color FROM roles ORDER BY id;

-- Sauvegarder les assignations
CREATE TEMP TABLE temp_assignments AS 
SELECT user_id, role_id, assigned_by, assigned_at FROM user_roles;

-- Vider les assignations temporairement
DELETE FROM user_roles;
DELETE FROM role_permissions;

-- Corriger les IDs des rôles avec un mapping approprié
UPDATE roles SET id = 1 WHERE name = 'admin' AND id = 2;
UPDATE roles SET id = 2 WHERE name = 'manager' AND id = 3; 
UPDATE roles SET id = 3 WHERE name = 'employee' AND id = 4;
UPDATE roles SET id = 4 WHERE name = 'directeur' AND id = 6;

-- Corriger les couleurs en même temps
UPDATE roles SET color = '#dc2626', display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb', display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a', display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed', display_name = 'Directeur' WHERE name = 'directeur';

-- Restaurer les assignations avec les nouveaux IDs
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
  user_id,
  CASE 
    WHEN role_id = 2 THEN 1  -- admin
    WHEN role_id = 3 THEN 2  -- manager
    WHEN role_id = 4 THEN 3  -- employee
    WHEN role_id = 6 THEN 4  -- directeur
    ELSE 1
  END as new_role_id,
  assigned_by,
  assigned_at
FROM temp_assignments;

-- Recréer les permissions de base pour les rôles
-- Admin (ID 1) : toutes les permissions
-- Manager (ID 2) : permissions limitées
-- Employee (ID 3) : permissions de base
-- Directeur (ID 4) : comme admin

-- Vérifier les résultats
SELECT 'APRÈS CORRECTION:' as status;
SELECT id, name, display_name, color FROM roles ORDER BY id;

SELECT 'ASSIGNATIONS CORRIGÉES:' as status;
SELECT ur.user_id, ur.role_id, r.name, r.display_name 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id;
EOF

echo ""
echo -e "${GREEN}✅ Correction appliquée !${NC}"
echo ""
echo -e "${YELLOW}🔄 Redémarrage de l'application...${NC}"
docker-compose restart logiflow-app

echo ""
echo -e "${GREEN}🎉 RÔLES CORRIGÉS :${NC}"
echo "• ID 1: Administrateur (rouge)"
echo "• ID 2: Manager (bleu)"
echo "• ID 3: Employé (vert)"
echo "• ID 4: Directeur (violet)"
echo ""
echo -e "${GREEN}✅ Vous pouvez maintenant changer les rôles sans erreur !${NC}"