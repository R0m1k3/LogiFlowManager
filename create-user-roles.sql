-- CORRECTION URGENTE: Création table user_roles manquante en production
-- Date: 2025-07-15
-- Problème: Error 42P01 "relation user_roles does not exist"

-- 1. Créer la table user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by VARCHAR NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 2. Ajouter les contraintes de clés étrangères (si les tables existent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_role_id 
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
        
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_assigned_by 
            FOREIGN KEY (assigned_by) REFERENCES users(id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL; -- Ignorer si contrainte existe déjà
END $$;

-- 3. Créer les index de performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- 4. Assigner rôle admin à l'utilisateur admin_local
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 'admin_local', 1, 'system', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'admin_local' AND role_id = 1)
  AND EXISTS (SELECT 1 FROM users WHERE id = 'admin_local')
  AND EXISTS (SELECT 1 FROM roles WHERE id = 1);

-- 5. Vérifications finales
SELECT 'SUCCESS: Table user_roles created successfully' as status;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

SELECT 'User roles count: ' || COUNT(*)::text as result FROM user_roles;

SELECT 
    'User: ' || u.username || ' has role: ' || r.name as assignment
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id;