-- =============================================================
-- CORRECTION AUTHENTIFICATION PRODUCTION
-- =============================================================
-- Utilisateur: directionfrouard_1752240832047
-- Problème: Erreur 401 - Authentification requise
-- Solution: Vérifier et corriger l'utilisateur + ses rôles

-- 1. Diagnostic initial
SELECT 'DIAGNOSTIC: Vérification utilisateur' as etape;

SELECT 
    id, 
    username, 
    email, 
    name, 
    role, 
    password_changed,
    created_at
FROM users 
WHERE id = 'directionfrouard_1752240832047';

-- 2. Vérifier rôles existants
SELECT 'DIAGNOSTIC: Vérification rôles utilisateur' as etape;

SELECT 
    ur.user_id,
    ur.role_id,
    r.name as role_name,
    r.display_name,
    ur.assigned_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'directionfrouard_1752240832047';

-- 3. Vérifier sessions actives
SELECT 'DIAGNOSTIC: Vérification sessions' as etape;

SELECT 
    sid,
    expire,
    CASE 
        WHEN expire > CURRENT_TIMESTAMP THEN 'Active'
        ELSE 'Expirée'
    END as status
FROM sessions 
WHERE sess::text LIKE '%directionfrouard_1752240832047%';

-- 4. Lister tous les rôles disponibles
SELECT 'DIAGNOSTIC: Rôles disponibles' as etape;

SELECT id, name, display_name, description, color, is_active
FROM roles
ORDER BY id;

-- =============================================================
-- CORRECTION
-- =============================================================

-- 5. Créer/mettre à jour l'utilisateur
SELECT 'CORRECTION: Mise à jour utilisateur' as etape;

INSERT INTO users (id, username, email, name, role, password, password_changed)
VALUES (
    'directionfrouard_1752240832047',
    'directionfrouard',
    'direction@frouard.com',
    'Direction Frouard',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    false
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    password_changed = EXCLUDED.password_changed,
    updated_at = CURRENT_TIMESTAMP;

-- 6. Assigner rôle admin (ID = 1)
SELECT 'CORRECTION: Assignation rôle admin' as etape;

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('directionfrouard_1752240832047', 1, 'system', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO UPDATE SET
    assigned_at = CURRENT_TIMESTAMP,
    assigned_by = 'system';

-- 7. Nettoyer sessions expirées
SELECT 'CORRECTION: Nettoyage sessions' as etape;

DELETE FROM sessions WHERE expire < CURRENT_TIMESTAMP;

-- =============================================================
-- VÉRIFICATION
-- =============================================================

-- 8. Vérifier la correction finale
SELECT 'VÉRIFICATION: Utilisateur corrigé' as etape;

SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    u.role as old_role_column,
    r.name as assigned_role,
    r.display_name,
    r.color,
    ur.assigned_at,
    CASE 
        WHEN ur.user_id IS NOT NULL THEN '✅ Rôle assigné'
        ELSE '❌ Pas de rôle'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'directionfrouard_1752240832047';

-- 9. Statistiques globales
SELECT 'VÉRIFICATION: Statistiques utilisateurs' as etape;

SELECT 
    COUNT(*) as total_users,
    COUNT(ur.user_id) as users_with_roles,
    COUNT(*) - COUNT(ur.user_id) as users_without_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;

-- 10. Lister tous les utilisateurs avec leurs rôles
SELECT 'VÉRIFICATION: Tous les utilisateurs' as etape;

SELECT 
    u.username,
    u.email,
    r.display_name as role_display,
    r.color,
    CASE 
        WHEN ur.user_id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- =============================================================
-- RÉSULTATS ATTENDUS
-- =============================================================
-- Après ces corrections :
-- 1. L'utilisateur directionfrouard_1752240832047 existe avec un rôle admin
-- 2. Il peut se connecter avec username: directionfrouard, password: password
-- 3. API /api/roles retourne 200 OK au lieu de 401
-- 4. Interface des rôles fonctionne avec couleurs
-- 5. Plus d'erreur "Authentification requise"
-- =============================================================