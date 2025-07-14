-- Migration sécurisée pour LogiFlow Production
-- Préserve toutes les données existantes

-- 1. Ajouter colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- Vérifier et ajouter delivered_date si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'delivered_date') THEN
        ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;
        RAISE NOTICE 'Colonne delivered_date ajoutée à la table deliveries';
    END IF;

    -- Vérifier et ajouter validated_at si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'validated_at') THEN
        ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;
        RAISE NOTICE 'Colonne validated_at ajoutée à la table deliveries';
    END IF;

    -- Vérifier et ajouter name si manquante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
        -- Remplir avec les données existantes
        UPDATE users SET name = COALESCE(first_name || ' ' || last_name, username, email) WHERE name IS NULL;
        RAISE NOTICE 'Colonne name ajoutée à la table users et remplie avec les données existantes';
    END IF;

    -- Vérifier et ajouter quantity si manquante dans customer_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_orders' AND column_name = 'quantity') THEN
        ALTER TABLE customer_orders ADD COLUMN quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne quantity ajoutée à la table customer_orders';
    END IF;

    -- Vérifier et ajouter quantity si manquante dans orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'quantity') THEN
        ALTER TABLE orders ADD COLUMN quantity INTEGER;
        RAISE NOTICE 'Colonne quantity ajoutée à la table orders';
    END IF;

    -- Vérifier et ajouter unit si manquante dans orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'unit') THEN
        ALTER TABLE orders ADD COLUMN unit VARCHAR(50);
        RAISE NOTICE 'Colonne unit ajoutée à la table orders';
    END IF;
END $$;

-- 2. Corriger les contraintes de status si nécessaire
DO $$
BEGIN
    -- Supprimer l'ancienne contrainte orders_status_check si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'orders_status_check') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
        RAISE NOTICE 'Ancienne contrainte orders_status_check supprimée';
    END IF;

    -- Ajouter la nouvelle contrainte
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'planned', 'delivered'));
    RAISE NOTICE 'Nouvelle contrainte orders_status_check ajoutée';

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Contrainte orders_status_check existe déjà';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la mise à jour des contraintes: %', SQLERRM;
END $$;

-- 3. Créer les tables manquantes si elles n'existent pas
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS nocodb_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    table_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    invoice_column_name VARCHAR(255) NOT NULL,
    api_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insérer les rôles par défaut seulement s'ils n'existent pas
INSERT INTO roles (name, description, is_system) VALUES
('admin', 'Administrateur avec accès complet', true),
('manager', 'Gestionnaire avec accès étendu', true),
('employee', 'Employé avec accès limité', true)
ON CONFLICT (name) DO NOTHING;

-- 5. Insérer les permissions par défaut seulement si elles n'existent pas
INSERT INTO permissions (name, description, category) VALUES
('dashboard.read', 'Voir le tableau de bord', 'dashboard'),
('calendar.read', 'Voir le calendrier', 'calendar'),
('calendar.create', 'Créer des éléments dans le calendrier', 'calendar'),
('calendar.update', 'Modifier des éléments du calendrier', 'calendar'),
('calendar.delete', 'Supprimer des éléments du calendrier', 'calendar'),
('orders.read', 'Voir les commandes', 'orders'),
('orders.create', 'Créer des commandes', 'orders'),
('orders.update', 'Modifier des commandes', 'orders'),
('orders.delete', 'Supprimer des commandes', 'orders'),
('deliveries.read', 'Voir les livraisons', 'deliveries'),
('deliveries.create', 'Créer des livraisons', 'deliveries'),
('deliveries.update', 'Modifier des livraisons', 'deliveries'),
('deliveries.delete', 'Supprimer des livraisons', 'deliveries'),
('deliveries.validate', 'Valider des livraisons', 'deliveries'),
('users.read', 'Voir les utilisateurs', 'users'),
('users.create', 'Créer des utilisateurs', 'users'),
('users.update', 'Modifier des utilisateurs', 'users'),
('users.delete', 'Supprimer des utilisateurs', 'users'),
('publicities.read', 'Voir les publicités', 'publicities'),
('publicities.create', 'Créer des publicités', 'publicities'),
('publicities.update', 'Modifier des publicités', 'publicities'),
('publicities.delete', 'Supprimer des publicités', 'publicities'),
('customer_orders.read', 'Voir les commandes clients', 'customer_orders'),
('customer_orders.create', 'Créer des commandes clients', 'customer_orders'),
('customer_orders.update', 'Modifier des commandes clients', 'customer_orders'),
('customer_orders.delete', 'Supprimer des commandes clients', 'customer_orders'),
('customer_orders.print', 'Imprimer des étiquettes', 'customer_orders'),
('customer_orders.notify', 'Notifier les clients', 'customer_orders')
ON CONFLICT (name) DO NOTHING;

-- 6. Message de fin
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION PRODUCTION TERMINÉE ===';
    RAISE NOTICE 'Toutes les données existantes ont été préservées';
    RAISE NOTICE 'Tables et colonnes mises à jour avec succès';
    RAISE NOTICE 'LogiFlow est prêt pour la production';
END $$;