-- DIAGNOSTIC ET CORRECTION PRODUCTION - Rôle ID 6 invalide
-- Date: 2025-07-15

-- 1. DIAGNOSTIC COMPLET
SELECT '=== RÔLES DISPONIBLES ===';
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

SELECT '=== UTILISATEURS AVEC RÔLES INVALIDES ===';
SELECT ur.user_id, ur.role_id, u.username, u.email 
FROM user_roles ur 
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE r.id IS NULL OR ur.role_id >= 5;

SELECT '=== TOUS LES USER_ROLES ===';
SELECT ur.user_id, ur.role_id, r.name as role_name, u.username
FROM user_roles ur 
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY ur.user_id;

SELECT '=== MAX ROLE ID ET RÉFÉRENCES INVALIDES ===';
SELECT MAX(id) as max_valid_role_id FROM roles;
SELECT COUNT(*) as invalid_assignments FROM user_roles WHERE role_id > (SELECT MAX(id) FROM roles);

-- 2. CORRECTION AUTOMATIQUE
SELECT '=== SUPPRESSION RÔLES INVALIDES ===';
DELETE FROM user_roles WHERE role_id > (SELECT MAX(id) FROM roles);

SELECT '=== NETTOYAGE USER_ROLES ORPHELINS ===';
DELETE FROM user_roles ur 
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = ur.role_id);

SELECT '=== ASSIGNATION RÔLES PAR DÉFAUT ===';
-- Assigner rôle Employee (ID 3) aux utilisateurs sans rôle
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, 3, 'admin_local', CURRENT_TIMESTAMP
FROM users u 
WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
AND u.id != 'admin_local';

-- 3. VÉRIFICATION POST-CORRECTION
SELECT '=== ÉTAT FINAL ===';
SELECT 
    u.id,
    u.username,
    u.email,
    u.role as legacy_role,
    ur.role_id,
    r.name as role_name,
    r.display_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

SELECT '=== STATISTIQUES FINALES ===';
SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.id;