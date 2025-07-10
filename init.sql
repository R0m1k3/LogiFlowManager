-- LogiFlow Database Initialization Script for Docker Production
-- This script creates the initial database structure and default data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: The application will handle user creation with proper password hashing
-- using the local authentication system. No need to create users here.

DO $$
BEGIN
    RAISE NOTICE 'Database initialized for LogiFlow application';
    RAISE NOTICE 'Default admin account will be created automatically: admin/admin';
END $$;

-- Create indexes for better performance (will be supplemented by Drizzle migrations)
-- These are commented out as they will be created by the ORM

-- Index for sessions table (will be created by connect-pg-simple)
-- CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

-- Indexes for better query performance
-- CREATE INDEX IF NOT EXISTS idx_orders_planned_date ON orders (planned_date);
-- CREATE INDEX IF NOT EXISTS idx_deliveries_planned_date ON deliveries (planned_date);
-- CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_date ON deliveries (delivered_date);
-- CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders (group_id);
-- CREATE INDEX IF NOT EXISTS idx_deliveries_group_id ON deliveries (group_id);