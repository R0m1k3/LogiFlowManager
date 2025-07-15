-- =============================================================
-- CORRECTION AUTHENTIFICATION GLOBALE PRODUCTION
-- =============================================================
-- Problème: Tous les utilisateurs ont erreur 401 sur les APIs
-- Solution: Vérifier et corriger les sessions + utilisateurs

-- 1. Diagnostic initial - Vérifier la table des sessions
SELECT 'DIAGNOSTIC: Table sessions' as etape;

SELECT COUNT(*) as total_sessions,
       COUNT(CASE WHEN expire > CURRENT_TIMESTAMP THEN 1 END) as active_sessions,
       COUNT(CASE WHEN expire <= CURRENT_TIMESTAMP THEN 1 END) as expired_sessions
FROM sessions;

-- 2. Vérifier les utilisateurs existants
SELECT 'DIAGNOSTIC: Utilisateurs' as etape;

SELECT 
    id,
    username,
    email,
    name,
    role,
    password_changed,
    created_at,
    CASE 
        WHEN password IS NULL THEN '❌ Pas de mot de passe'
        WHEN LENGTH(password) < 10 THEN '❌ Mot de passe trop court'
        ELSE '✅ Mot de passe OK'
    END as password_status
FROM users
ORDER BY created_at;

-- 3. Vérifier les rôles utilisateur
SELECT 'DIAGNOSTIC: Rôles utilisateur' as etape;

SELECT 
    u.username,
    u.email,
    ur.role_id,
    r.name as role_name,
    r.display_name,
    ur.assigned_at,
    CASE 
        WHEN ur.user_id IS NULL THEN '❌ Pas de rôle'
        ELSE '✅ Rôle assigné'
    END as role_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 4. Vérifier la table session (nom correct)
SELECT 'DIAGNOSTIC: Structure table session' as etape;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'session'
ORDER BY ordinal_position;

-- =============================================================
-- CORRECTION GLOBALE
-- =============================================================

-- 5. Nettoyer toutes les sessions expirées
SELECT 'CORRECTION: Nettoyage sessions expirées' as etape;

DELETE FROM sessions WHERE expire < CURRENT_TIMESTAMP;

-- Alternative si la table s'appelle 'session' (singulier)
DELETE FROM session WHERE expire < CURRENT_TIMESTAMP;

-- 6. Vérifier/corriger l'utilisateur admin principal
SELECT 'CORRECTION: Utilisateur admin principal' as etape;

INSERT INTO users (id, username, email, name, role, password, password_changed)
VALUES (
    'admin_local',
    'admin',
    'admin@logiflow.com',
    'Administrateur',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "admin"
    false
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    password_changed = EXCLUDED.password_changed;

-- 7. Assigner rôle admin à l'utilisateur principal
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('admin_local', 1, 'system', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO UPDATE SET
    assigned_at = CURRENT_TIMESTAMP;

-- 8. Corriger l'utilisateur directionfrouard_1752240832047
SELECT 'CORRECTION: Utilisateur directionfrouard' as etape;

INSERT INTO users (id, username, email, name, role, password, password_changed)
VALUES (
    'directionfrouard_1752240832047',
    'directionfrouard',
    'direction@frouard.com',
    'Direction Frouard',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "admin"
    false
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password = EXCLUDED.password,
    password_changed = EXCLUDED.password_changed;

-- 9. Assigner rôle admin à directionfrouard
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES ('directionfrouard_1752240832047', 1, 'system', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO UPDATE SET
    assigned_at = CURRENT_TIMESTAMP;

-- 10. Corriger tous les utilisateurs sans rôle
SELECT 'CORRECTION: Utilisateurs sans rôle' as etape;

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    3, -- rôle employee par défaut
    'system',
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- =============================================================
-- VÉRIFICATION FINALE
-- =============================================================

-- 11. Vérifier tous les utilisateurs avec rôles
SELECT 'VÉRIFICATION: Utilisateurs finaux' as etape;

SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    r.name as role_name,
    r.display_name,
    r.color,
    ur.assigned_at,
    CASE 
        WHEN ur.user_id IS NOT NULL THEN '✅ Complet'
        ELSE '❌ Incomplet'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 12. Statistiques finales
SELECT 'VÉRIFICATION: Statistiques' as etape;

SELECT 
    'Utilisateurs totaux' as type,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Utilisateurs avec rôles' as type,
    COUNT(DISTINCT ur.user_id) as count
FROM user_roles ur
UNION ALL
SELECT 
    'Sessions actives' as type,
    COUNT(*) as count
FROM sessions 
WHERE expire > CURRENT_TIMESTAMP
UNION ALL
SELECT 
    'Rôles disponibles' as type,
    COUNT(*) as count
FROM roles
WHERE is_active = true;

-- =============================================================
-- INSTRUCTIONS POST-CORRECTION
-- =============================================================

-- REDÉMARRER L'APPLICATION APRÈS CES CORRECTIONS :
-- docker-compose restart logiflow-app

-- TESTER LES CONNEXIONS :
-- 1. admin / admin
-- 2. directionfrouard / admin

-- VÉRIFIER LES APIs :
-- GET /api/user (devrait retourner 200)
-- GET /api/roles (devrait retourner 200)
-- GET /api/permissions (devrait retourner 200)

-- =============================================================