-- Migration SQL pour mise à jour production LogiFlow
-- Date: 2025-07-14
-- Objectif: Ajouter les nouvelles fonctionnalités sans perdre les données

-- Commencer une transaction pour s'assurer de la cohérence
BEGIN;

-- 1. Vérifier et ajouter les colonnes manquantes dans la table deliveries
DO $$
BEGIN
    -- Ajouter delivered_date si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'delivered_date') THEN
        ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;
        RAISE NOTICE 'Colonne delivered_date ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne delivered_date existe déjà dans deliveries';
    END IF;

    -- Ajouter validated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'validated_at') THEN
        ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;
        RAISE NOTICE 'Colonne validated_at ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne validated_at existe déjà dans deliveries';
    END IF;

    -- Ajouter bl_number si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'bl_number') THEN
        ALTER TABLE deliveries ADD COLUMN bl_number VARCHAR(255);
        RAISE NOTICE 'Colonne bl_number ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne bl_number existe déjà dans deliveries';
    END IF;

    -- Ajouter bl_amount si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'bl_amount') THEN
        ALTER TABLE deliveries ADD COLUMN bl_amount DECIMAL(10,2);
        RAISE NOTICE 'Colonne bl_amount ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne bl_amount existe déjà dans deliveries';
    END IF;

    -- Ajouter invoice_reference si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'invoice_reference') THEN
        ALTER TABLE deliveries ADD COLUMN invoice_reference VARCHAR(255);
        RAISE NOTICE 'Colonne invoice_reference ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne invoice_reference existe déjà dans deliveries';
    END IF;

    -- Ajouter invoice_amount si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'invoice_amount') THEN
        ALTER TABLE deliveries ADD COLUMN invoice_amount DECIMAL(10,2);
        RAISE NOTICE 'Colonne invoice_amount ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne invoice_amount existe déjà dans deliveries';
    END IF;

    -- Ajouter reconciled si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'reconciled') THEN
        ALTER TABLE deliveries ADD COLUMN reconciled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne reconciled ajoutée à la table deliveries';
    ELSE
        RAISE NOTICE 'Colonne reconciled existe déjà dans deliveries';
    END IF;
END $$;

-- 2. Vérifier et ajouter la colonne name dans users si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
        
        -- Migrer les données existantes: utiliser username comme nom par défaut
        UPDATE users SET name = COALESCE(username, email, 'Utilisateur') WHERE name IS NULL;
        
        RAISE NOTICE 'Colonne name ajoutée à la table users et données migrées';
    ELSE
        RAISE NOTICE 'Colonne name existe déjà dans users';
    END IF;
END $$;

-- 3. Corriger la contrainte status pour orders (autoriser 'delivered')
DO $$
BEGIN
    -- Supprimer l'ancienne contrainte si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'orders' AND constraint_name = 'orders_status_check') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
        RAISE NOTICE 'Ancienne contrainte orders_status_check supprimée';
    END IF;
    
    -- Ajouter la nouvelle contrainte avec 'delivered'
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'planned', 'delivered'));
    RAISE NOTICE 'Nouvelle contrainte orders_status_check ajoutée avec delivered';
END $$;

-- 4. Créer les tables pour le système de rôles et permissions (si elles n'existent pas)
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

-- 5. Créer les tables pour les publicités (si elles n'existent pas)
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

-- 6. Créer les tables pour la configuration NocoDB (si elles n'existent pas)
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

-- 7. Ajouter les colonnes NocoDB dans groups si elles n'existent pas
DO $$
BEGIN
    -- Ajouter nocodb_config_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_config_id') THEN
        ALTER TABLE groups ADD COLUMN nocodb_config_id INTEGER REFERENCES nocodb_configs(id);
        RAISE NOTICE 'Colonne nocodb_config_id ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_config_id existe déjà dans groups';
    END IF;

    -- Ajouter nocodb_table_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_table_id') THEN
        ALTER TABLE groups ADD COLUMN nocodb_table_id VARCHAR(255);
        RAISE NOTICE 'Colonne nocodb_table_id ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_table_id existe déjà dans groups';
    END IF;

    -- Ajouter nocodb_table_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_table_name') THEN
        ALTER TABLE groups ADD COLUMN nocodb_table_name VARCHAR(255);
        RAISE NOTICE 'Colonne nocodb_table_name ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_table_name existe déjà dans groups';
    END IF;

    -- Ajouter invoice_column_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'invoice_column_name') THEN
        ALTER TABLE groups ADD COLUMN invoice_column_name VARCHAR(255) DEFAULT 'RefFacture';
        RAISE NOTICE 'Colonne invoice_column_name ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne invoice_column_name existe déjà dans groups';
    END IF;
END $$;

-- 8. Créer les index pour optimiser les performances
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

-- 9. Insérer les rôles par défaut (seulement s'ils n'existent pas)
INSERT INTO roles (name, description, is_system) 
VALUES 
    ('admin', 'Administrateur système avec tous les droits', true),
    ('manager', 'Gestionnaire avec droits étendus', true),
    ('employee', 'Employé avec droits limités', true)
ON CONFLICT (name) DO NOTHING;

-- 10. Insérer les permissions par défaut (seulement si elles n'existent pas)
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

-- 11. Assigner les permissions aux rôles par défaut
DO $$
DECLARE
    admin_role_id INTEGER;
    manager_role_id INTEGER;
    employee_role_id INTEGER;
BEGIN
    -- Récupérer les IDs des rôles
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    SELECT id INTO employee_role_id FROM roles WHERE name = 'employee';
    
    -- Admin : toutes les permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Manager : permissions étendues (pas de gestion des rôles)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE name NOT LIKE 'roles.%' AND name NOT LIKE 'users.delete'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Employee : permissions limitées (lecture principalement)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT employee_role_id, id FROM permissions 
    WHERE name IN (
        'dashboard.read', 'calendar.read', 'calendar.create',
        'orders.read', 'orders.create', 'deliveries.read', 'deliveries.create',
        'reconciliation.read', 'groups.read', 'suppliers.read', 'publicities.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE 'Permissions assignées aux rôles par défaut';
END $$;

-- 12. Mettre à jour la colonne delivered_date pour les livraisons existantes
UPDATE deliveries 
SET delivered_date = updated_at 
WHERE status = 'delivered' AND delivered_date IS NULL;

-- 13. Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables principales (si pas déjà existant)
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
END $$;

-- Valider la transaction
COMMIT;

-- Afficher un résumé des modifications
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION TERMINÉE AVEC SUCCÈS ===';
    RAISE NOTICE 'Tables vérifiées/créées: users, groups, orders, deliveries, roles, permissions, role_permissions, publicities, publicity_participations, nocodb_configs';
    RAISE NOTICE 'Colonnes ajoutées si nécessaire: delivered_date, validated_at, bl_number, bl_amount, invoice_reference, invoice_amount, reconciled dans deliveries';
    RAISE NOTICE 'Colonnes NocoDB ajoutées dans groups: nocodb_config_id, nocodb_table_id, nocodb_table_name, invoice_column_name';
    RAISE NOTICE 'Contrainte orders_status_check mise à jour pour inclure delivered';
    RAISE NOTICE 'Système de rôles et permissions initialisé';
    RAISE NOTICE 'Index de performance créés';
    RAISE NOTICE 'Triggers updated_at configurés';
    RAISE NOTICE '=== DONNÉES EXISTANTES PRÉSERVÉES ===';
END $$;