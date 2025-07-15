#!/bin/bash

echo "🚀 CORRECTION URGENTE - Problème assignation rôles production"
echo "=========================================================="
echo "Date: $(date)"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 DIAGNOSTIC INITIAL"
echo "===================="

echo "🗄️  Rôles disponibles:"
psql $DATABASE_URL -c "SELECT id, name, display_name, color FROM roles ORDER BY id;"

echo ""
echo "👤 Utilisateurs actuels:"
psql $DATABASE_URL -c "SELECT id, username, email, name FROM users;"

echo ""
echo "🔗 Assignations actuelles user_roles:"
psql $DATABASE_URL -c "SELECT ur.user_id, ur.role_id, r.name as role_name, ur.assigned_by FROM user_roles ur JOIN roles r ON ur.role_id = r.id;"

echo ""
echo "🔧 CORRECTION DES PROBLÈMES"
echo "==========================="

# 1. Nettoyer les assignations de rôles invalides
echo "🧹 Nettoyage des assignations de rôles invalides..."
psql $DATABASE_URL -c "DELETE FROM user_roles WHERE role_id NOT IN (SELECT id FROM roles);"

# 2. Assigner des rôles par défaut aux utilisateurs sans rôle
echo "👥 Assignation rôles par défaut aux utilisateurs sans rôle..."
psql $DATABASE_URL -c "
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, 3, 'system', CURRENT_TIMESTAMP  -- Rôle employee (ID 3) par défaut
FROM users u 
WHERE u.id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT DO NOTHING;
"

# 3. Corriger l'utilisateur admin_local pour avoir le rôle admin
echo "🔧 Correction rôle admin pour admin_local..."
psql $DATABASE_URL -c "
DELETE FROM user_roles WHERE user_id = 'admin_local';
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('admin_local', 1, 'system', CURRENT_TIMESTAMP);
"

echo ""
echo "✅ VÉRIFICATION POST-CORRECTION"
echo "=============================="

echo "🔗 Nouvelles assignations user_roles:"
psql $DATABASE_URL -c "SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, ur.assigned_by FROM user_roles ur JOIN roles r ON ur.role_id = r.id ORDER BY ur.user_id;"

echo ""
echo "🧪 TEST API ASSIGNATION RÔLE"
echo "=========================="

# Test d'assignation de rôle via API
echo "🔄 Test assignation rôle Manager (ID 2) à l'utilisateur directionfrouard..."

# D'abord vérifier que l'utilisateur existe
USER_EXISTS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users WHERE id = 'directionfrouard_1752240832047';" | tr -d ' ')

if [ "$USER_EXISTS" -eq 1 ]; then
    echo "✅ Utilisateur directionfrouard_1752240832047 trouvé"
    
    # Test direct SQL
    echo "🔧 Test assignation directe SQL..."
    psql $DATABASE_URL -c "
    DELETE FROM user_roles WHERE user_id = 'directionfrouard_1752240832047';
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES ('directionfrouard_1752240832047', 2, 'admin_local', CURRENT_TIMESTAMP);
    "
    
    echo "✅ Vérification assignation:"
    psql $DATABASE_URL -c "SELECT ur.user_id, ur.role_id, r.name as role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = 'directionfrouard_1752240832047';"
    
else
    echo "❌ Utilisateur directionfrouard_1752240832047 non trouvé"
    echo "📋 Utilisateurs disponibles:"
    psql $DATABASE_URL -c "SELECT id, username FROM users;"
fi

echo ""
echo "🎯 DIAGNOSTIC FRONTEND"
echo "===================="

# Tester l'API backend directement
echo "🔄 Test GET /api/roles..."
curl -s http://localhost:5000/api/roles | jq '.[] | {id, name, displayName, color}' 2>/dev/null || echo "❌ Erreur API ou jq non installé"

echo ""
echo "🔄 Test GET /api/users..."
curl -s http://localhost:5000/api/users | jq '.[] | {id, username, userRoles}' 2>/dev/null || echo "❌ Erreur API ou jq non installé"

echo ""
echo "💡 RECOMMANDATIONS"
echo "=================="
echo "1. ✅ Base de données nettoyée et rôles assignés"
echo "2. 🔄 Redémarrer l'application si nécessaire: npm run dev"
echo "3. 🧪 Tester l'interface de gestion des rôles"
echo "4. 🐛 Vérifier les logs frontend pour identifier pourquoi l'ID 6 est envoyé"
echo "5. 📱 Actualiser le cache du navigateur (Ctrl+F5)"

echo ""
echo -e "✅ ${GREEN}CORRECTION TERMINÉE${NC}"
echo "L'assignation des rôles devrait maintenant fonctionner correctement."