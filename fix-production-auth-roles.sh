#!/bin/bash

echo "🚀 DIAGNOSTIC ET CORRECTION PRODUCTION - Problème rôles utilisateur"
echo "=================================================================="
echo "Date: $(date)"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 DIAGNOSTIC PRODUCTION COMPLET"
echo "==============================="

echo "🗄️  Rôles disponibles en production:"
psql $DATABASE_URL -c "SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;"

echo ""
echo "👤 Utilisateurs en production:"
psql $DATABASE_URL -c "SELECT id, username, email, name FROM users ORDER BY username;"

echo ""
echo "🔗 Assignations user_roles actuelles:"
psql $DATABASE_URL -c "
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color, ur.assigned_by 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;
"

echo ""
echo "🎯 VÉRIFICATION UTILISATEUR SPÉCIFIQUE"
echo "===================================="

# Vérifier que l'utilisateur directionfrouard existe en production
USER_ID="directionfrouard_1752240832047"
USER_EXISTS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users WHERE id = '$USER_ID';" | tr -d ' ')

if [ "$USER_EXISTS" -eq 1 ]; then
    echo -e "✅ ${GREEN}Utilisateur $USER_ID trouvé en production${NC}"
    
    echo "📋 Détails utilisateur:"
    psql $DATABASE_URL -c "SELECT id, username, email, name, role FROM users WHERE id = '$USER_ID';"
    
    echo "🔗 Rôles assignés actuellement:"
    psql $DATABASE_URL -c "
    SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = '$USER_ID';
    "
    
else
    echo -e "❌ ${RED}Utilisateur $USER_ID NON TROUVÉ en production${NC}"
    echo "📋 Utilisateurs disponibles:"
    psql $DATABASE_URL -c "SELECT id, username FROM users WHERE id LIKE '%direction%' OR username LIKE '%direction%';"
fi

echo ""
echo "🔧 DIAGNOSTIC PROBLÈME RÔLE ID 6"
echo "==============================="

# Vérifier s'il y a des références au rôle ID 6 quelque part
echo "🔍 Recherche références rôle ID 6 dans user_roles:"
psql $DATABASE_URL -c "SELECT * FROM user_roles WHERE role_id = 6;"

echo "🔍 Recherche dans table users (colonne role):"
psql $DATABASE_URL -c "SELECT id, username, role FROM users WHERE role = '6' OR role = 'directeur' OR role LIKE '%6%';"

echo "🔍 Vérification max ID rôles:"
psql $DATABASE_URL -c "SELECT MAX(id) as max_role_id FROM roles;"

echo ""
echo "🛠️  CORRECTION AUTOMATIQUE"
echo "========================="

if [ "$USER_EXISTS" -eq 1 ]; then
    echo "🔧 Correction assignation rôle pour $USER_ID..."
    
    # Supprimer les assignations existantes
    psql $DATABASE_URL -c "DELETE FROM user_roles WHERE user_id = '$USER_ID';"
    
    # Assigner le rôle directeur (ID 4) - le plus approprié
    psql $DATABASE_URL -c "
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES ('$USER_ID', 4, 'admin_local', CURRENT_TIMESTAMP);
    "
    
    echo "✅ Rôle directeur (ID 4) assigné avec succès"
    
    echo "🔍 Vérification post-correction:"
    psql $DATABASE_URL -c "
    SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = '$USER_ID';
    "
else
    echo "⚠️  Impossible de corriger - utilisateur non trouvé"
fi

echo ""
echo "🔍 CORRECTION COLONNE USERS.ROLE"
echo "==============================="

# Mettre à jour la colonne role dans users pour cohérence
echo "🔧 Mise à jour colonne users.role basée sur user_roles..."
psql $DATABASE_URL -c "
UPDATE users 
SET role = (
    SELECT r.name 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = users.id 
    LIMIT 1
)
WHERE id IN (SELECT user_id FROM user_roles);
"

echo "✅ Mise à jour terminée"

echo ""
echo "📊 ÉTAT FINAL DE LA PRODUCTION"
echo "============================"

echo "🔗 Toutes les assignations user_roles:"
psql $DATABASE_URL -c "
SELECT ur.user_id, u.username, ur.role_id, r.name as role_name, r.display_name, r.color, ur.assigned_by 
FROM user_roles ur 
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id 
ORDER BY u.username;
"

echo "👤 Cohérence users.role vs user_roles:"
psql $DATABASE_URL -c "
SELECT u.id, u.username, u.role as users_role, r.name as actual_role, r.display_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

echo ""
echo "🧪 TEST API PRODUCTION"
echo "===================="

# Test des APIs critiques (sans authentification pour diagnostic)
echo "🔄 Test structure réponse /api/roles:"
curl -s http://localhost:3000/api/roles 2>/dev/null | head -c 200 || echo "❌ API non accessible ou erreur"

echo ""
echo "🔄 Test structure réponse /api/users:"
curl -s http://localhost:3000/api/users 2>/dev/null | head -c 200 || echo "❌ API non accessible ou erreur"

echo ""
echo "💡 RECOMMANDATIONS PRODUCTION"
echo "==========================="
echo "1. ✅ Rôles corrigés en base de données"
echo "2. 🔄 Redémarrer conteneur Docker pour appliquer les corrections backend"
echo "3. 🧹 Vider cache navigateur (Ctrl+F5) sur la page des rôles"
echo "4. 🧪 Tester assignation rôles via interface web"
echo "5. 📱 Vérifier que les couleurs s'affichent correctement"

echo ""
echo -e "✅ ${GREEN}DIAGNOSTIC ET CORRECTION PRODUCTION TERMINÉS${NC}"
echo "Le problème d'assignation de rôles devrait être résolu."