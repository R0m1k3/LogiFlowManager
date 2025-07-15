#!/bin/bash

echo "=== CORRECTION AUTHENTIFICATION PRODUCTION ==="
echo "Date: $(date)"
echo ""

echo "🔍 PROBLÈME IDENTIFIÉ :"
echo "- Utilisateur directionfrouard_1752240832047 n'est pas authentifié correctement"
echo "- API /api/roles retourne 401 (Authentification requise)"
echo "- Page des rôles ne peut pas charger les données"
echo ""

echo "🎯 CAUSES POSSIBLES :"
echo "1. Session expirée ou invalide"
echo "2. Utilisateur n'existe pas en base de données"
echo "3. Problème de synchronisation des sessions"
echo "4. Rôle utilisateur manquant ou invalide"
echo ""

echo "🔧 ÉTAPES DE DIAGNOSTIC EN PRODUCTION :"
echo ""

echo "1. Vérifier existence utilisateur:"
echo "   SELECT id, username, email, role, password_changed FROM users WHERE id = 'directionfrouard_1752240832047';"
echo ""

echo "2. Vérifier sessions actives:"
echo "   SELECT sid, sess, expire FROM sessions WHERE sess::text LIKE '%directionfrouard_1752240832047%';"
echo ""

echo "3. Vérifier rôles utilisateur:"
echo "   SELECT ur.*, r.name as role_name FROM user_roles ur"
echo "   JOIN roles r ON ur.role_id = r.id"
echo "   WHERE ur.user_id = 'directionfrouard_1752240832047';"
echo ""

echo "🚀 CORRECTION SQL PRODUCTION :"
echo ""

cat << 'EOF'
-- 1. Vérifier et créer l'utilisateur si nécessaire
INSERT INTO users (id, username, email, name, role, password, password_changed)
VALUES (
    'directionfrouard_1752240832047',
    'directionfrouard',
    'direction@frouard.com',
    'Direction Frouard',
    'admin',
    '$2a$10$defaultPasswordHashHere',
    false
) ON CONFLICT (id) DO NOTHING;

-- 2. Assigner un rôle admin
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('directionfrouard_1752240832047', 1, 'system', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO UPDATE SET
    assigned_at = CURRENT_TIMESTAMP;

-- 3. Nettoyer les sessions expirées
DELETE FROM sessions WHERE expire < CURRENT_TIMESTAMP;

-- 4. Vérifier la correction
SELECT 
    u.id,
    u.username,
    u.email,
    u.role as old_role,
    r.name as new_role,
    ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'directionfrouard_1752240832047';
EOF

echo ""
echo "📋 COMMANDES PRODUCTION :"
echo ""
echo "# Se connecter à la base de données"
echo "docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db"
echo ""
echo "# Ou si PostgreSQL externe:"
echo "psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db"
echo ""
echo "# Exécuter les requêtes SQL ci-dessus"
echo "# Puis redémarrer l'application"
echo "docker-compose restart logiflow-app"
echo ""

echo "🔍 VÉRIFICATION APRÈS CORRECTION :"
echo "1. L'utilisateur peut se connecter"
echo "2. API /api/roles retourne 200 OK"
echo "3. Page des rôles s'affiche correctement"
echo "4. Couleurs des rôles visibles"
echo ""

echo "⚠️  NOTES IMPORTANTES :"
echo "- Remplacer le hash de mot de passe par un vrai hash"
echo "- L'utilisateur devra changer son mot de passe"
echo "- Vérifier les permissions du rôle admin"
echo ""

echo "✅ APRÈS CORRECTION :"
echo "- Authentification fonctionnelle"
echo "- Interface des rôles accessible"
echo "- Toutes les couleurs et fonctionnalités actives"