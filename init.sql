-- LogiFlow Database Schema Initialization for Production

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    password TEXT NOT NULL,
    password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table  
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#1976D2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    contact TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    planned_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'received')),
    notes TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    scheduled_date TEXT NOT NULL,
    quantity INTEGER,
    unit TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
    notes TEXT,
    bl_number TEXT,
    bl_amount DECIMAL(10,2),
    invoice_reference TEXT,
    invoice_amount DECIMAL(10,2),
    reconciled BOOLEAN DEFAULT FALSE,
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Groups junction table
CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Sessions table for express-session
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Insert default data
INSERT INTO groups (id, name, color) VALUES 
    (1, 'Frouard', '#1976D2'),
    (2, 'Nancy', '#388E3C'),
    (3, 'Metz', '#F57C00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, name, contact, email, phone) VALUES 
    (1, 'Fournisseur Test', 'Contact Principal', 'contact@fournisseur.fr', '03.83.00.00.00'),
    (2, 'Logistique Pro', 'Service Commercial', 'commercial@logistique-pro.fr', '03.87.11.22.33')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to correct values
SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_planned_date ON orders (planned_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON deliveries (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders (group_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_group_id ON deliveries (group_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups (group_id);

DO $$
BEGIN
    RAISE NOTICE 'LogiFlow database schema initialized successfully';
    RAISE NOTICE 'Default admin account will be created by application: admin/admin';
END $$;