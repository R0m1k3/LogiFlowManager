-- =============================================================
-- CORRECTION UTILISATEUR PRODUCTION - directionfrouard_1752240832047
-- =============================================================
-- Date: 2025-07-15
-- Problème: Utilisateur existe mais n'a pas de rôle assigné
-- Solution: Vérifier et assigner un rôle par défaut

-- 1. Vérifier l'existence de l'utilisateur
SELECT 
    id, 
    username, 
    name, 
    role,
    email,
    created_at 
FROM users 
WHERE id = 'directionfrouard_1752240832047';

-- 2. Vérifier les rôles existants de cet utilisateur
SELECT 
    ur.user_id,
    ur.role_id,
    r.name as role_name,
    r.display_name,
    ur.assigned_at,
    ur.assigned_by
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'directionfrouard_1752240832047';

-- 3. Lister tous les rôles disponibles
SELECT 
    id, 
    name, 
    display_name, 
    description, 
    color,
    is_active 
FROM roles 
ORDER BY id;

-- 4. Assigner un rôle par défaut (employee = ID 3) si aucun rôle n'est assigné
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('directionfrouard_1752240832047', 3, 'admin_local', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 5. Vérifier la correction
SELECT 
    u.id,
    u.username,
    u.name,
    r.name as role_name,
    r.display_name as role_display_name,
    r.color as role_color,
    ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'directionfrouard_1752240832047';

-- 6. Vérifier la cohérence globale des utilisateurs avec rôles
SELECT 
    u.id,
    u.username,
    u.name,
    u.role as old_role_column,
    r.name as new_role_system,
    r.display_name,
    CASE 
        WHEN ur.user_id IS NULL THEN '❌ SANS RÔLE'
        ELSE '✅ AVEC RÔLE'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 7. Statistiques des rôles
SELECT 
    r.name as role_name,
    r.display_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY user_count DESC;

-- =============================================================
-- NOTES IMPORTANTES :
-- - Exécuter ce script en production avec psql
-- - Vérifier les résultats avant de redémarrer l'application
-- - Rôle 3 = 'employee' (rôle par défaut sécurisé)
-- - Après correction, l'interface des rôles fonctionnera
-- =============================================================