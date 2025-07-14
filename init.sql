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
    nocodb_config_id INTEGER,
    nocodb_table_id VARCHAR,
    nocodb_table_name VARCHAR,
    invoice_column_name VARCHAR DEFAULT 'RefFacture',
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

-- Publicities table
CREATE TABLE IF NOT EXISTS publicities (
    id SERIAL PRIMARY KEY,
    pub_number VARCHAR NOT NULL,
    designation TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    created_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publicity Participations junction table 
CREATE TABLE IF NOT EXISTS publicity_participations (
    publicity_id INTEGER NOT NULL REFERENCES publicities(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (publicity_id, group_id)
);

-- Roles table (for dynamic role management)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table (for fine-grained permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Customer Orders table
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

-- NocoDB configuration table
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

-- Note: No default data inserted
-- Groups and suppliers will be created by administrators as needed
-- Roles and permissions will be initialized by the application

-- Reset sequences to correct values (only if data exists)
SELECT setval('groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM groups));
SELECT setval('suppliers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM suppliers));
SELECT setval('publicities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM publicities));
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles));
SELECT setval('permissions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM permissions));

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

-- Publicity indexes
CREATE INDEX IF NOT EXISTS idx_publicities_year ON publicities (year);
CREATE INDEX IF NOT EXISTS idx_publicities_start_date ON publicities (start_date);
CREATE INDEX IF NOT EXISTS idx_publicities_end_date ON publicities (end_date);
CREATE INDEX IF NOT EXISTS idx_publicities_created_by ON publicities (created_by);
CREATE INDEX IF NOT EXISTS idx_publicity_participations_publicity_id ON publicity_participations (publicity_id);
CREATE INDEX IF NOT EXISTS idx_publicity_participations_group_id ON publicity_participations (group_id);

-- Roles and permissions indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles (name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles (is_system);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions (category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);

-- Customer Orders indexes
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_name ON customer_orders (customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_orders_supplier_id ON customer_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_group_id ON customer_orders (group_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_order_date ON customer_orders (order_date);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders (status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_by ON customer_orders (created_by);

-- NocoDB configuration indexes
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_group_id ON nocodb_configs (group_id);
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_project_id ON nocodb_configs (project_id);
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_table_id ON nocodb_configs (table_id);

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
    RAISE NOTICE '- publicities (campagnes publicitaires)';
    RAISE NOTICE '- publicity_participations (magasins participants)';
    RAISE NOTICE '- roles (rôles système et personnalisés)';
    RAISE NOTICE '- permissions (permissions granulaires)';
    RAISE NOTICE '- role_permissions (liaisons rôles-permissions)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Aucune donnée de test insérée automatiquement';
    RAISE NOTICE 'Groupes et fournisseurs à créer par l''administrateur';
    RAISE NOTICE 'Compte admin sera créé par l''application';
    RAISE NOTICE 'Rôles et permissions seront initialisés par l''application';
    RAISE NOTICE '==========================================';
END $$;