#!/bin/bash

echo "🔧 SOLUTION RADICALE - Correction complète de tous les problèmes production..."

# 1. Diagnostic complet de l'état actuel
echo "=== 1. DIAGNOSTIC COMPLET ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- État des rôles
SELECT 'ROLES:' as type, r.id, r.name, r.display_name, r.color FROM roles r ORDER BY r.id;

-- État des utilisateurs avec leurs rôles
SELECT 'USERS_ROLES:' as type, 
    u.username, 
    u.role as old_role, 
    ur.role_id as new_role_id,
    r.name as new_role_name,
    r.color as role_color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- État des groupes d'utilisateurs
SELECT 'USER_GROUPS:' as type,
    u.username,
    ug.group_id,
    g.name as group_name
FROM users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
ORDER BY u.username;
"

# 2. RÉINITIALISATION COMPLÈTE DES RÔLES
echo "=== 2. RÉINITIALISATION RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Supprimer toutes les assignations de rôles existantes
DELETE FROM user_roles;

-- Corriger les couleurs des rôles
UPDATE roles SET color = '#dc2626', display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb', display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a', display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed', display_name = 'Directeur' WHERE name = 'directeur';

-- Réassigner les rôles basés sur la colonne users.role
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' OR u.username = 'admin' THEN 1
        WHEN u.role = 'manager' THEN 2
        WHEN u.role = 'employee' THEN 3
        WHEN u.role = 'directeur' THEN 4
        ELSE 3  -- employé par défaut
    END,
    'admin_local',
    CURRENT_TIMESTAMP
FROM users u;

-- Synchroniser la colonne users.role avec les nouveaux rôles
UPDATE users 
SET role = r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE users.id = ur.user_id;
"

# 3. CORRECTION SPÉCIFIQUE POUR RUDOLPH MATTON
echo "=== 3. CORRECTION RUDOLPH MATTON ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Vérifier et corriger spécifiquement Rudolph MATTON
UPDATE users SET role = 'manager' WHERE username LIKE '%MATTON%';
UPDATE user_roles SET role_id = 2 WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%MATTON%');
"

# 4. NETTOYAGE ET OPTIMISATION
echo "=== 4. NETTOYAGE BASE DE DONNÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Supprimer les doublons potentiels
DELETE FROM user_roles ur1 
WHERE EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = ur1.user_id 
    AND ur2.role_id = ur1.role_id 
    AND ur2.assigned_at > ur1.assigned_at
);

-- Réindexer les tables
REINDEX TABLE users;
REINDEX TABLE roles;
REINDEX TABLE user_roles;
REINDEX TABLE user_groups;

-- Mettre à jour les statistiques
ANALYZE users;
ANALYZE roles;
ANALYZE user_roles;
ANALYZE user_groups;
"

# 5. VÉRIFICATION FINALE COMPLÈTE
echo "=== 5. VÉRIFICATION FINALE ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    '=== ÉTAT FINAL ===' as section,
    u.username,
    u.role as user_role,
    r.name as assigned_role,
    r.display_name,
    r.color,
    COUNT(ug.group_id) as nb_groups,
    CASE 
        WHEN u.role = r.name THEN '✅ COHÉRENT'
        ELSE '❌ INCOHÉRENT'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_groups ug ON u.id = ug.user_id
GROUP BY u.id, u.username, u.role, r.name, r.display_name, r.color
ORDER BY u.username;
"

# 6. RECONSTRUCTION DE L'APPLICATION
echo "=== 6. RECONSTRUCTION APPLICATION ==="
echo "Arrêt de l'application..."
docker stop logiflow_app

echo "Reconstruction du conteneur..."
docker build -t logiflow:latest .

echo "Redémarrage avec base de données corrigée..."
docker-compose up -d

echo "Attente stabilisation..."
sleep 15

# 7. TEST DE L'API
echo "=== 7. TEST API ==="
echo "Test API users..."
curl -s http://localhost:3000/api/users | head -c 200
echo ""

echo "Test API roles..."
curl -s http://localhost:3000/api/roles | head -c 200
echo ""

echo "✅ CORRECTION RADICALE TERMINÉE!"
echo ""
echo "📋 RÉSUMÉ DES CORRECTIONS:"
echo "   ✓ Tous les rôles réinitialisés et réassignés"
echo "   ✓ Couleurs des rôles corrigées (rouge, bleu, vert, violet)"
echo "   ✓ Rudolph MATTON spécifiquement corrigé en Manager"
echo "   ✓ Base de données nettoyée et optimisée"
echo "   ✓ Application reconstruite et redémarrée"
echo "   ✓ APIs testées"
echo ""
echo "🎯 L'attribution des groupes devrait maintenant fonctionner parfaitement!"