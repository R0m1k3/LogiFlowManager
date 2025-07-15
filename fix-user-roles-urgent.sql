-- CORRECTION URGENTE TABLE USER_ROLES PRODUCTION
-- Exécuter ce script directement dans PostgreSQL production

-- 1. Créer la table user_roles manquante
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 2. Créer les index de performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- 3. Vérifier que les rôles existent
INSERT INTO roles (name, display_name, description, color, is_system, is_active) VALUES 
    ('admin', 'Administrateur', 'Accès complet au système', '#FF5722', true, true),
    ('manager', 'Manager', 'Gestion des magasins et équipes', '#2196F3', true, true),
    ('employee', 'Employé', 'Accès standard aux fonctionnalités', '#4CAF50', true, true),
    ('directeur', 'Directeur', 'Supervision régionale', '#9C27B0', true, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    color = EXCLUDED.color;

-- 4. Assigner rôle admin à l'utilisateur admin
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    'admin_local', 
    r.id, 
    'system', 
    CURRENT_TIMESTAMP
FROM roles r 
WHERE r.name = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = 'admin_local'
)
AND EXISTS (SELECT 1 FROM users WHERE id = 'admin_local');

-- 5. Assigner rôle employee par défaut aux autres utilisateurs
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    r.id,
    'system',
    CURRENT_TIMESTAMP
FROM users u
CROSS JOIN roles r
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
AND u.id != 'admin_local'
AND r.name = 'employee';

-- 6. Vérification finale
SELECT 
    'TABLE CREATED' as status,
    COUNT(*) as user_roles_count
FROM user_roles;

SELECT 
    'USER ROLES ASSIGNED' as status,
    u.id,
    u.username,
    r.name as role_name,
    ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;