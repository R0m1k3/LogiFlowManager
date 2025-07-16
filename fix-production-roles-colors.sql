-- CORRECTION PRODUCTION - Synchronisation Rôles Rudolph MATTON
-- Résoud l'incohérence entre page Utilisateurs et page Gestion des Rôles

-- 1. Diagnostic initial : vérifier l'état actuel
SELECT 
    '=== DIAGNOSTIC INITIAL ===' as step,
    u.id,
    u.username,
    u.email,
    u.name,
    u.role as user_table_role,
    ur.role_id,
    r.name as role_name,
    r.color as role_color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.name LIKE '%Rudolph%' OR u.email LIKE '%rudolph%'
ORDER BY u.username;

-- 2. Vérifier tous les utilisateurs avec incohérences
SELECT 
    '=== INCOHÉRENCES DÉTECTÉES ===' as step,
    u.id,
    u.username,
    u.role as user_table_role,
    ur.role_id,
    r.name as role_name,
    CASE 
        WHEN u.role = 'admin' AND ur.role_id = 1 THEN 'OK'
        WHEN u.role = 'manager' AND ur.role_id = 2 THEN 'OK'
        WHEN u.role = 'employee' AND ur.role_id = 3 THEN 'OK'
        WHEN u.role = 'directeur' AND ur.role_id = 4 THEN 'OK'
        ELSE 'INCOHÉRENT'
    END as coherence_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.role IS NOT NULL
ORDER BY coherence_status DESC, u.username;

-- 3. Corriger les rôles manquants dans user_roles
-- Synchroniser tous les utilisateurs avec leur rôle de la table users
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 1
        WHEN u.role = 'manager' THEN 2
        WHEN u.role = 'employee' THEN 3
        WHEN u.role = 'directeur' THEN 4
        ELSE 2 -- Par défaut manager
    END as role_id,
    'system_sync' as assigned_by,
    NOW() as assigned_at
FROM users u
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
  );

-- 4. Corriger les rôles incorrects dans user_roles
UPDATE user_roles 
SET role_id = CASE 
    WHEN u.role = 'admin' THEN 1
    WHEN u.role = 'manager' THEN 2
    WHEN u.role = 'employee' THEN 3
    WHEN u.role = 'directeur' THEN 4
    ELSE 2
END,
assigned_by = 'system_sync',
assigned_at = NOW()
FROM users u
WHERE user_roles.user_id = u.id
  AND user_roles.role_id != CASE 
    WHEN u.role = 'admin' THEN 1
    WHEN u.role = 'manager' THEN 2
    WHEN u.role = 'employee' THEN 3
    WHEN u.role = 'directeur' THEN 4
    ELSE 2
  END;

-- 5. Vérifier les corrections appliquées
SELECT 
    '=== APRÈS CORRECTION ===' as step,
    u.id,
    u.username,
    u.email,
    u.name,
    u.role as user_table_role,
    ur.role_id,
    r.name as role_name,
    r.color as role_color,
    CASE 
        WHEN u.role = 'admin' AND ur.role_id = 1 THEN 'OK'
        WHEN u.role = 'manager' AND ur.role_id = 2 THEN 'OK'
        WHEN u.role = 'employee' AND ur.role_id = 3 THEN 'OK'
        WHEN u.role = 'directeur' AND ur.role_id = 4 THEN 'OK'
        ELSE 'INCOHÉRENT'
    END as coherence_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.role IS NOT NULL
ORDER BY u.username;

-- 6. Compter les corrections appliquées
SELECT 
    '=== RÉSUMÉ CORRECTIONS ===' as step,
    COUNT(*) as total_users,
    COUNT(CASE WHEN ur.role_id IS NOT NULL THEN 1 END) as users_with_role_assignment,
    COUNT(CASE WHEN ur.role_id IS NULL THEN 1 END) as users_without_role_assignment
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.role IS NOT NULL;