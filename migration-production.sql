-- LogiFlow Production Migration Script
-- Ce script met à jour la base de données existante avec les nouvelles fonctionnalités
-- Utilise ADD COLUMN IF NOT EXISTS pour éviter les erreurs si déjà appliqué

-- Ajouter les colonnes manquantes pour les rôles dynamiques si pas encore présentes
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Ajouter les colonnes manquantes pour les livraisons BL/Factures si pas encore présentes
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- Ajouter les colonnes manquantes pour les commandes clients si pas encore présentes
CREATE TABLE IF NOT EXISTS customer_orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR,
    customer_email VARCHAR,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    product_description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    order_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'available', 'collected', 'cancelled')),
    notes TEXT,
    created_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter les colonnes manquantes pour la configuration NocoDB si pas encore présentes
CREATE TABLE IF NOT EXISTS nocodb_configs (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    project_id VARCHAR NOT NULL,
    table_id VARCHAR NOT NULL,
    table_name VARCHAR NOT NULL,
    invoice_column_name VARCHAR NOT NULL DEFAULT 'RefFacture',
    api_token VARCHAR,
    base_url VARCHAR DEFAULT 'https://nocodb.ffnancy.fr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id)
);

-- Ajouter les index pour les nouvelles tables
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_name ON customer_orders (customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_orders_supplier_id ON customer_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_group_id ON customer_orders (group_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_order_date ON customer_orders (order_date);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders (status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_by ON customer_orders (created_by);

CREATE INDEX IF NOT EXISTS idx_nocodb_configs_group_id ON nocodb_configs (group_id);
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_project_id ON nocodb_configs (project_id);
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_table_id ON nocodb_configs (table_id);

-- Mettre à jour les contraintes si nécessaire
DO $$
BEGIN
    -- Vérifier et corriger la contrainte orders_status_check
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'orders_status_check' 
        AND check_clause NOT LIKE '%delivered%'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('pending', 'planned', 'delivered'));
    END IF;
END $$;

-- Ajouter les colonnes groups si manquantes
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_config_id INTEGER REFERENCES nocodb_configs(id);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_table_id VARCHAR;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS nocodb_table_name VARCHAR;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invoice_column_name VARCHAR DEFAULT 'RefFacture';

-- Insérer les configurations NocoDB par défaut si elles n'existent pas
INSERT INTO nocodb_configs (group_id, project_id, table_id, table_name, invoice_column_name, base_url)
SELECT 
    g.id,
    'pcg4uw79ukvycxc',
    CASE 
        WHEN g.name = 'Houdemont' THEN 'my7zunxprumahmm'
        WHEN g.name = 'Frouard' THEN 'mrr733dfb8wtt9b'
        ELSE 'my7zunxprumahmm'
    END,
    CASE 
        WHEN g.name = 'Houdemont' THEN 'CommandeH'
        WHEN g.name = 'Frouard' THEN 'CommandeF'
        ELSE 'CommandeDefault'
    END,
    'RefFacture',
    'https://nocodb.ffnancy.fr'
FROM groups g
WHERE NOT EXISTS (
    SELECT 1 FROM nocodb_configs nc WHERE nc.group_id = g.id
);

-- Mettre à jour les groupes avec les configurations NocoDB
UPDATE groups SET 
    nocodb_config_id = nc.id,
    nocodb_table_id = nc.table_id,
    nocodb_table_name = nc.table_name,
    invoice_column_name = nc.invoice_column_name
FROM nocodb_configs nc
WHERE groups.id = nc.group_id
AND groups.nocodb_config_id IS NULL;

-- Notification de fin
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION PRODUCTION TERMINÉE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Colonnes ajoutées si nécessaire:';
    RAISE NOTICE '- users.password_changed';
    RAISE NOTICE '- deliveries.delivered_date';
    RAISE NOTICE '- deliveries.validated_at';
    RAISE NOTICE '- groups.nocodb_*';
    RAISE NOTICE 'Tables créées si nécessaire:';
    RAISE NOTICE '- customer_orders';
    RAISE NOTICE '- nocodb_configs';
    RAISE NOTICE 'Contraintes mises à jour:';
    RAISE NOTICE '- orders_status_check (ajout delivered)';
    RAISE NOTICE '========================================';
END $$;