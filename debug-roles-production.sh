#!/bin/bash

echo "🔍 COMPARAISON DÉVELOPPEMENT vs PRODUCTION - Système de rôles"
echo "============================================================"
echo "Date: $(date)"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📊 DIAGNOSTIC BASE DE DONNÉES PRODUCTION"
echo "======================================="

echo "🗄️ Rôles en production:"
psql $DATABASE_URL -c "SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;"

echo ""
echo "👤 Utilisateurs avec rôles en production:"
psql $DATABASE_URL -c "
SELECT 
    u.id, 
    u.username, 
    u.email, 
    u.role as legacy_role,
    ur.role_id as new_role_id,
    r.name as role_name,
    r.display_name,
    r.color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

echo ""
echo "🔍 RECHERCHE UTILISATEUR DIRECTIONFROUARD"
echo "========================================"

USER_ID="directionfrouard_1752240832047"
echo "🔎 Recherche exact ID: $USER_ID"
psql $DATABASE_URL -c "SELECT id, username, email, name, role FROM users WHERE id = '$USER_ID';"

echo "🔎 Recherche pattern direction:"
psql $DATABASE_URL -c "SELECT id, username, email, name, role FROM users WHERE id LIKE '%direction%' OR username LIKE '%direction%';"

echo "🔎 Tous les utilisateurs en production:"
psql $DATABASE_URL -c "SELECT id, username, email FROM users ORDER BY username;"

echo ""
echo "🔧 RECHERCHE PROBLÈME RÔLE ID 6"
echo "=============================="

echo "❓ Y a-t-il des références au rôle ID 6?"
psql $DATABASE_URL -c "SELECT * FROM user_roles WHERE role_id = 6;"

echo "❓ Y a-t-il un rôle avec ID 6?"
psql $DATABASE_URL -c "SELECT * FROM roles WHERE id = 6;"

echo "❓ Quel est le max ID des rôles?"
psql $DATABASE_URL -c "SELECT MAX(id) as max_role_id, COUNT(*) as total_roles FROM roles;"

echo ""
echo "🌐 TEST APIs PRODUCTION"
echo "======================"

# Test direct des APIs
echo "🔄 Test /api/roles (structure):"
ROLES_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/roles 2>/dev/null)
echo "Status: ${ROLES_RESPONSE: -3}"
echo "Response length: $(echo "$ROLES_RESPONSE" | head -c -4 | wc -c) chars"

echo ""
echo "🔄 Test /api/users (structure):"
USERS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/users 2>/dev/null)
echo "Status: ${USERS_RESPONSE: -3}"
echo "Response length: $(echo "$USERS_RESPONSE" | head -c -4 | wc -c) chars"

echo ""
echo "📋 COMPARAISON FICHIERS CRITIQUES"
echo "================================"

echo "🔍 Vérification fichier storage.production.ts (getRoles):"
if [ -f "server/storage.production.ts" ]; then
    echo "✅ Fichier existe"
    grep -n "getRoles" server/storage.production.ts | head -5
    echo ""
    echo "🔍 Mapping displayName dans getRoles:"
    grep -A 10 -B 5 "displayName.*row" server/storage.production.ts | head -15
else
    echo "❌ Fichier storage.production.ts manquant"
fi

echo ""
echo "🔍 Vérification fichier routes.production.ts (routes rôles):"
if [ -f "server/routes.production.ts" ]; then
    echo "✅ Fichier existe"
    grep -n "/api/roles" server/routes.production.ts
    echo ""
    grep -n "/api/users.*roles" server/routes.production.ts
else
    echo "❌ Fichier routes.production.ts manquant"
fi

echo ""
echo "🎯 FRONTEND - Vérification RoleManagement.tsx"
echo "============================================"

if [ -f "client/src/pages/RoleManagement.tsx" ]; then
    echo "✅ Fichier RoleManagement.tsx existe"
    echo ""
    echo "🔍 Recherche selectedRoleForUser (problème ID 6):"
    grep -n -A 3 -B 3 "selectedRoleForUser.*=" client/src/pages/RoleManagement.tsx | head -20
    echo ""
    echo "🔍 Recherche setSelectedRoleForUser:"
    grep -n "setSelectedRoleForUser" client/src/pages/RoleManagement.tsx | head -10
    echo ""
    echo "🔍 Recherche handleUserRolesUpdate:"
    grep -n -A 10 "handleUserRolesUpdate" client/src/pages/RoleManagement.tsx | head -15
else
    echo "❌ Fichier RoleManagement.tsx manquant"
fi

echo ""
echo "🚨 DIAGNOSTIC SPÉCIFIQUE ID 6"
echo "============================="

echo "🔍 Variables d'état dans RoleManagement.tsx:"
if [ -f "client/src/pages/RoleManagement.tsx" ]; then
    grep -n "useState.*Role" client/src/pages/RoleManagement.tsx
    echo ""
    echo "🔍 Initialisation selectedRoleForUser:"
    grep -n -A 5 -B 5 "selectedRoleForUser.*useState" client/src/pages/RoleManagement.tsx
fi

echo ""
echo "📱 CACHE ET SESSION PRODUCTION"
echo "=============================="

echo "🔍 Headers cache dans les réponses API:"
curl -I -s http://localhost:3000/api/roles 2>/dev/null | grep -i cache || echo "Pas d'info cache"

echo ""
echo "🔍 Sessions utilisateur actives:"
psql $DATABASE_URL -c "SELECT COUNT(*) as active_sessions FROM session;"

echo ""
echo "💡 HYPOTHÈSES PROBLÈME ID 6"
echo "=========================="
echo "1. 🔍 Frontend utilise ancien cache avec rôle ID 6 supprimé"
echo "2. 🔍 Variable selectedRoleForUser mal initialisée"
echo "3. 🔍 Utilisateur directionfrouard a un ancien rôle legacy"
echo "4. 🔍 Incohérence entre users.role et user_roles.role_id"
echo "5. 🔍 Frontend dev vs production utilisent APIs différentes"

echo ""
echo "🛠️ RECOMMANDATIONS URGENTES"
echo "=========================="
echo "1. 🧹 Vider cache navigateur production (Ctrl+F5)"
echo "2. 🔄 Redémarrer conteneur Docker production"
echo "3. 🔍 Vérifier logs console frontend en production"
echo "4. 🧪 Tester assignation avec utilisateur existant"
echo "5. 📝 Comparer réponses API dev vs prod"

echo ""
echo -e "✅ ${GREEN}DIAGNOSTIC TERMINÉ${NC}"
echo "Exécuter ce script sur le serveur de production pour identifier le problème."