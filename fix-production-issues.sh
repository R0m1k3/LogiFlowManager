#!/bin/bash

echo "🔧 Diagnostic et correction des problèmes de production..."

# 1. Vérifier l'état actuel des utilisateurs et leurs rôles
echo "=== 1. DIAGNOSTIC UTILISATEURS ET RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as old_role_column,
    r.name as new_role_name,
    r.display_name,
    r.color,
    ur.assigned_at,
    CASE 
        WHEN ur.role_id IS NULL THEN 'AUCUN_ROLE_ASSIGNE'
        WHEN u.role != r.name THEN 'INCOHERENT'
        ELSE 'COHERENT'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 2. Vérifier les groupes assignés
echo "=== 2. DIAGNOSTIC GROUPES ASSIGNÉS ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    g.name as group_name,
    g.color as group_color,
    ug.user_id,
    ug.group_id
FROM users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
ORDER BY u.username, g.name;
"

# 3. Corriger les incohérences de rôles
echo "=== 3. CORRECTION DES INCOHÉRENCES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Synchroniser la colonne role avec les rôles assignés
UPDATE users 
SET role = r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE users.id = ur.user_id;
"

# 4. Assigner des rôles par défaut aux utilisateurs sans rôle
echo "=== 4. ASSIGNATION RÔLES PAR DÉFAUT ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Trouver les utilisateurs sans rôle et leur assigner un rôle par défaut
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    CASE 
        WHEN u.username = 'admin' THEN 1  -- admin
        WHEN u.role = 'manager' THEN 2    -- manager  
        WHEN u.role = 'employee' THEN 3   -- employee
        WHEN u.role = 'directeur' THEN 4  -- directeur
        ELSE 3  -- employee par défaut
    END,
    'admin_local',
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;
"

# 5. Corriger les couleurs des rôles
echo "=== 5. CORRECTION COULEURS RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
UPDATE roles SET color = '#dc2626' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed' WHERE name = 'directeur';
"

# 6. Vérification finale
echo "=== 6. VÉRIFICATION FINALE ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as synchronized_role,
    r.name as role_name,
    r.display_name,
    r.color,
    COUNT(ug.group_id) as nb_groups
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_groups ug ON u.id = ug.user_id
GROUP BY u.id, u.username, u.role, r.name, r.display_name, r.color
ORDER BY u.username;
"

# 7. Redémarrer l'application
echo "=== 7. REDÉMARRAGE APPLICATION ==="
docker restart logiflow_app

echo "✅ Corrections appliquées!"
echo "📋 Résumé:"
echo "   - Rôles synchronisés entre ancienne et nouvelle table"
echo "   - Rôles par défaut assignés aux utilisateurs sans rôle"
echo "   - Couleurs des rôles corrigées"
echo "   - Application redémarrée"