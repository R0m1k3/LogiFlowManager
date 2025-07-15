-- Ajout de la table user_roles manquante
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Ajout des colonnes manquantes aux tables existantes
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#6b7280';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- Mise à jour des séquences
SELECT setval('user_roles_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM user_roles));
