-- LogiFlow Database Schema Initialization for Production
-- SCHÉMA COMPLET BASÉ SUR shared/schema.ts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (for express-session storage)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Users table (complete with all fields from schema)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    name VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    password VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table  
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table (complete with all fields)
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (complete with all fields)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    quantity INTEGER,
    unit VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'delivered')),
    notes TEXT,
    created_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries table (complete with all BL/reconciliation fields)
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    delivered_date TIMESTAMP,
    quantity INTEGER NOT NULL,
    unit VARCHAR NOT NULL CHECK (unit IN ('palettes', 'colis')),
    status VARCHAR NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'delivered')),
    notes TEXT,
    bl_number VARCHAR,
    bl_amount DECIMAL(10,2),
    invoice_reference VARCHAR,
    invoice_amount DECIMAL(10,2),
    reconciled BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMP,
    created_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Groups junction table (composite primary key - no ID)
CREATE TABLE IF NOT EXISTS user_groups (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

-- Note: No default data inserted
-- Groups and suppliers will be created by administrators as needed

-- Reset sequences to correct values (only if data exists)
SELECT setval('groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM groups));
SELECT setval('suppliers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM suppliers));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_planned_date ON orders (planned_date);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders (group_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders (created_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON deliveries (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_supplier_id ON deliveries (supplier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_group_id ON deliveries (group_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_by ON deliveries (created_by);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries (status);
CREATE INDEX IF NOT EXISTS idx_deliveries_reconciled ON deliveries (reconciled);

CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups (group_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups (name);

-- Notification de fin
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'LogiFlow SCHEMA COMPLET INITIALISÉ';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables créées:';
    RAISE NOTICE '- sessions (express-session)';
    RAISE NOTICE '- users (avec tous les champs)';
    RAISE NOTICE '- groups (magasins)';
    RAISE NOTICE '- suppliers (fournisseurs)';
    RAISE NOTICE '- orders (commandes avec notes)';
    RAISE NOTICE '- deliveries (livraisons avec BL/factures)';
    RAISE NOTICE '- user_groups (clé composite)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Aucune donnée de test insérée automatiquement';
    RAISE NOTICE 'Groupes et fournisseurs à créer par l''administrateur';
    RAISE NOTICE 'Compte admin sera créé par l''application';
    RAISE NOTICE '==========================================';
END $$;