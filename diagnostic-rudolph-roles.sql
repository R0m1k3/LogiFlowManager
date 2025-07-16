-- DIAGNOSTIC COMPLET - Incohérence Rôles Rudolph MATTON

-- 1. Vérifier les données utilisateur Rudolph
SELECT 
    id,
    username,
    email,
    name,
    role as user_table_role,
    created_at,
    updated_at
FROM users 
WHERE username = 'rudolph' OR email LIKE '%rudolph%' OR name LIKE '%Rudolph%'
ORDER BY id;

-- 2. Vérifier les assignations de rôles dans user_roles
SELECT 
    ur.user_id,
    ur.role_id,
    ur.assigned_by,
    ur.assigned_at,
    r.name as role_name,
    r.color as role_color
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id IN (
    SELECT id FROM users WHERE username = 'rudolph' OR email LIKE '%rudolph%' OR name LIKE '%Rudolph%'
)
ORDER BY ur.assigned_at;

-- 3. Vérifier tous les rôles existants
SELECT 
    id,
    name,
    display_name,
    color,
    is_active
FROM roles
ORDER BY id;

-- 4. Vérifier tous les utilisateurs avec leurs rôles
SELECT 
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
ORDER BY u.username;

-- 5. Identifier les incohérences
SELECT 
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

-- 6. Compter les incohérences
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN ur.role_id IS NULL THEN 1 END) as users_without_role_assignment,
    COUNT(CASE WHEN u.role != r.name THEN 1 END) as role_mismatches
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.role IS NOT NULL;
