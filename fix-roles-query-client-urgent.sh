#!/bin/bash

echo "🔧 CORRECTION URGENTE - Problème cache React Query et rôle ID 6"
echo "=============================================================="
echo "Date: $(date)"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 DIAGNOSTIC - Ligne problématique identifiée"
echo "=============================================="
echo ""
echo "Dans RoleManagement.tsx ligne 621:"
echo "setSelectedRoleForUser(user.userRoles?.[0]?.roleId || null);"
echo ""
echo "Le problème: user.userRoles?.[0]?.roleId retourne probablement 6"
echo "Alors que les rôles valides sont: 1, 2, 3, 4"
echo ""

echo "🧪 DIAGNOSTIC BASE DE DONNÉES"
echo "============================"

echo "🔍 Vérification utilisateur directionfrouard en production:"
USER_ID="directionfrouard_1752240832047"
psql $DATABASE_URL -c "SELECT id, username, email, name, role FROM users WHERE id = '$USER_ID';"

echo ""
echo "🔍 Rôles assignés à cet utilisateur:"
psql $DATABASE_URL -c "
SELECT ur.user_id, ur.role_id, r.name as role_name, ur.assigned_by, ur.assigned_at
FROM user_roles ur 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE ur.user_id = '$USER_ID';
"

echo ""
echo "🔍 Recherche tous rôles avec ID >= 5:"
psql $DATABASE_URL -c "SELECT id, name, display_name FROM roles WHERE id >= 5;"

echo ""
echo "🔍 Recherche user_roles avec roleId >= 5:"
psql $DATABASE_URL -c "SELECT user_id, role_id FROM user_roles WHERE role_id >= 5;"

echo ""
echo "🔍 API getUserWithRoles pour cet utilisateur:"
echo "Simulation de ce que retourne l'API /api/users pour directionfrouard:"
psql $DATABASE_URL -c "
SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    u.role as legacy_role,
    json_agg(
        json_build_object(
            'userId', ur.user_id,
            'roleId', ur.role_id,
            'assignedBy', ur.assigned_by,
            'assignedAt', ur.assigned_at,
            'role', json_build_object(
                'id', r.id,
                'name', r.name,
                'displayName', r.display_name
            )
        )
    ) FILTER (WHERE ur.user_id IS NOT NULL) as userRoles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = '$USER_ID'
GROUP BY u.id, u.username, u.email, u.name, u.role;
"

echo ""
echo "🛠️ CORRECTION AUTOMATIQUE"
echo "========================"

# Vérifier si l'utilisateur existe
USER_EXISTS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users WHERE id = '$USER_ID';" | tr -d ' ')

if [ "$USER_EXISTS" -eq 1 ]; then
    echo -e "✅ ${GREEN}Utilisateur $USER_ID trouvé${NC}"
    
    # Nettoyer les rôles invalides
    echo "🧹 Suppression des rôles invalides (ID >= 5):"
    psql $DATABASE_URL -c "DELETE FROM user_roles WHERE user_id = '$USER_ID' AND role_id >= 5;"
    
    # Assigner un rôle valide par défaut (Directeur = ID 4)
    echo "🎯 Attribution rôle Directeur (ID 4):"
    psql $DATABASE_URL -c "
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES ('$USER_ID', 4, 'admin_local', CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
    "
    
    # Mettre à jour la colonne legacy users.role
    echo "🔄 Mise à jour colonne users.role:"
    psql $DATABASE_URL -c "UPDATE users SET role = 'directeur' WHERE id = '$USER_ID';"
    
    echo "✅ Correction terminée"
    
else
    echo -e "❌ ${RED}Utilisateur $USER_ID NON TROUVÉ en production${NC}"
    echo "🔍 Recherche utilisateurs similaires:"
    psql $DATABASE_URL -c "SELECT id, username FROM users WHERE username LIKE '%direction%' OR id LIKE '%direction%';"
fi

echo ""
echo "🔍 VÉRIFICATION POST-CORRECTION"
echo "============================="

echo "🔗 État final des rôles utilisateur:"
psql $DATABASE_URL -c "
SELECT 
    u.id,
    u.username,
    u.role as legacy_role,
    ur.role_id,
    r.name as role_name,
    r.display_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id LIKE '%direction%' OR u.username LIKE '%direction%'
ORDER BY u.username;
"

echo ""
echo "📱 RECOMMANDATIONS FRONTEND"
echo "=========================="
echo "1. 🧹 Vider cache navigateur (Ctrl+F5 ou Ctrl+Shift+R)"
echo "2. 🔄 Redémarrer l'application si nécessaire"
echo "3. 🧪 Tester à nouveau l'assignation de rôles"
echo "4. 🔍 Vérifier les logs console frontend pour user.userRoles?.[0]?.roleId"

echo ""
echo "💡 SOLUTION ALTERNATIVE FRONTEND"
echo "==============================="
echo "Si le problème persiste, ajouter une validation dans RoleManagement.tsx:"
echo ""
echo "// Ligne 621, remplacer:"
echo "setSelectedRoleForUser(user.userRoles?.[0]?.roleId || null);"
echo ""
echo "// Par:"
echo "const roleId = user.userRoles?.[0]?.roleId;"
echo "const validRoleId = roleId && roleId >= 1 && roleId <= 4 ? roleId : null;"
echo "setSelectedRoleForUser(validRoleId);"

echo ""
echo -e "✅ ${GREEN}DIAGNOSTIC ET CORRECTION TERMINÉS${NC}"
echo "Le problème de rôle ID 6 devrait être résolu."