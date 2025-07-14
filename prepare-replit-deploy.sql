-- Script de préparation pour déploiement Replit
-- Adaptation de migration-production.sql pour environnement Replit/Neon
-- Date: 2025-07-14

-- Note: Replit utilise Neon PostgreSQL, pas Docker
-- Ce script s'exécute directement sur la base Neon via DATABASE_URL

-- 1. Vérifier et ajouter les colonnes BL/Facture dans deliveries
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS bl_number VARCHAR(255);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS bl_amount DECIMAL(10,2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS invoice_reference VARCHAR(255);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(10,2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT FALSE;

-- 2. Ajouter la colonne name dans users (si manquante)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Migrer les données existantes
UPDATE users SET name = COALESCE(username, email, 'Utilisateur') WHERE name IS NULL OR name = '';

-- 3. Corriger la contrainte status pour orders
-- Supprimer l'ancienne contrainte et créer la nouvelle
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'orders' AND constraint_name = 'orders_status_check') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
    END IF;
    
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'planned', 'delivered'));
END $$;

-- 4. Tables système de rôles et permissions
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- 5. Tables publicités
CREATE TABLE IF NOT EXISTS publicities (
    id SERIAL PRIMARY KEY,
    pub_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publicity_participations (
    id SERIAL PRIMARY KEY,
    publicity_id INTEGER NOT NULL REFERENCES publicities(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(publicity_id, group_id)
);

-- 6. Tables configuration NocoDB
CREATE TABLE IF NOT EXISTS nocodb_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Colonnes NocoDB dans groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_config_id INTEGER REFERENCES nocodb_configs(id);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_table_id VARCHAR(255);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_table_name VARCHAR(255);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invoice_column_name VARCHAR(255) DEFAULT 'RefFacture';

-- 8. Index pour performances
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_group_id ON deliveries(group_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_invoice_ref ON deliveries(invoice_reference);
CREATE INDEX IF NOT EXISTS idx_deliveries_bl_number ON deliveries(bl_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders(group_id);
CREATE INDEX IF NOT EXISTS idx_publicities_year ON publicities(year);
CREATE INDEX IF NOT EXISTS idx_publicities_start_date ON publicities(start_date);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 9. Rôles par défaut
INSERT INTO roles (name, description, is_system) 
VALUES 
    ('admin', 'Administrateur système avec tous les droits', true),
    ('manager', 'Gestionnaire avec droits étendus', true),
    ('employee', 'Employé avec droits limités', true)
ON CONFLICT (name) DO NOTHING;

-- 10. Permissions par défaut
INSERT INTO permissions (name, category, description) VALUES
    ('dashboard.read', 'Dashboard', 'Voir le tableau de bord'),
    ('calendar.read', 'Calendrier', 'Voir le calendrier'),
    ('calendar.create', 'Calendrier', 'Créer des événements'),
    ('calendar.update', 'Calendrier', 'Modifier des événements'),
    ('calendar.delete', 'Calendrier', 'Supprimer des événements'),
    ('orders.read', 'Commandes', 'Voir les commandes'),
    ('orders.create', 'Commandes', 'Créer des commandes'),
    ('orders.update', 'Commandes', 'Modifier des commandes'),
    ('orders.delete', 'Commandes', 'Supprimer des commandes'),
    ('deliveries.read', 'Livraisons', 'Voir les livraisons'),
    ('deliveries.create', 'Livraisons', 'Créer des livraisons'),
    ('deliveries.update', 'Livraisons', 'Modifier des livraisons'),
    ('deliveries.delete', 'Livraisons', 'Supprimer des livraisons'),
    ('deliveries.validate', 'Livraisons', 'Valider des livraisons'),
    ('reconciliation.read', 'Rapprochement', 'Voir le rapprochement BL/Factures'),
    ('reconciliation.update', 'Rapprochement', 'Modifier le rapprochement'),
    ('users.read', 'Utilisateurs', 'Voir les utilisateurs'),
    ('users.create', 'Utilisateurs', 'Créer des utilisateurs'),
    ('users.update', 'Utilisateurs', 'Modifier des utilisateurs'),
    ('users.delete', 'Utilisateurs', 'Supprimer des utilisateurs'),
    ('groups.read', 'Magasins', 'Voir les magasins'),
    ('groups.create', 'Magasins', 'Créer des magasins'),
    ('groups.update', 'Magasins', 'Modifier des magasins'),
    ('groups.delete', 'Magasins', 'Supprimer des magasins'),
    ('suppliers.read', 'Fournisseurs', 'Voir les fournisseurs'),
    ('suppliers.create', 'Fournisseurs', 'Créer des fournisseurs'),
    ('suppliers.update', 'Fournisseurs', 'Modifier des fournisseurs'),
    ('suppliers.delete', 'Fournisseurs', 'Supprimer des fournisseurs'),
    ('publicities.read', 'Publicités', 'Voir les publicités'),
    ('publicities.create', 'Publicités', 'Créer des publicités'),
    ('publicities.update', 'Publicités', 'Modifier des publicités'),
    ('publicities.delete', 'Publicités', 'Supprimer des publicités'),
    ('roles.read', 'Rôles', 'Voir les rôles'),
    ('roles.create', 'Rôles', 'Créer des rôles'),
    ('roles.update', 'Rôles', 'Modifier des rôles'),
    ('roles.delete', 'Rôles', 'Supprimer des rôles')
ON CONFLICT (name) DO NOTHING;

-- 11. Assigner permissions aux rôles
DO $$
DECLARE
    admin_role_id INTEGER;
    manager_role_id INTEGER;
    employee_role_id INTEGER;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    SELECT id INTO employee_role_id FROM roles WHERE name = 'employee';
    
    -- Admin : toutes les permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Manager : permissions étendues
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE name NOT LIKE 'roles.%' AND name NOT LIKE 'users.delete'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Employee : permissions limitées
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT employee_role_id, id FROM permissions 
    WHERE name IN (
        'dashboard.read', 'calendar.read', 'calendar.create',
        'orders.read', 'orders.create', 'deliveries.read', 'deliveries.create',
        'reconciliation.read', 'groups.read', 'suppliers.read', 'publicities.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- 12. Mettre à jour les données existantes
UPDATE deliveries 
SET delivered_date = updated_at 
WHERE status = 'delivered' AND delivered_date IS NULL;

-- 13. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers si ils n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_groups_updated_at') THEN
        CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deliveries_updated_at') THEN
        CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_publicities_updated_at') THEN
        CREATE TRIGGER update_publicities_updated_at BEFORE UPDATE ON publicities
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;