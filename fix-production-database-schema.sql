-- ===============================================
-- FIX PRODUCTION DATABASE SCHEMA - PERMISSIONS TABLE
-- ===============================================

-- Add missing columns to permissions table
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(100);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update existing permissions with display_name (fallback to name)
UPDATE permissions SET display_name = name WHERE display_name IS NULL;

-- Add missing columns to roles table if needed
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6b7280';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing roles with display_name (fallback to name)
UPDATE roles SET display_name = name WHERE display_name IS NULL;

-- Verify schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'permissions' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;