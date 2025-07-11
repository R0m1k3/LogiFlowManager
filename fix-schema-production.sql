-- MISE À JOUR DU SCHÉMA PRODUCTION POUR COHÉRENCE COMPLÈTE
-- =========================================================

-- 1. ORDERS TABLE - S'assurer que les colonnes correspondent au code
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si comments existe, migrer vers notes puis supprimer comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'comments') THEN
        -- Migrer les données de comments vers notes
        UPDATE orders SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE orders DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in orders table';
    END IF;
END $$;

-- 2. DELIVERIES TABLE - S'assurer que les colonnes correspondent au code
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS scheduled_date TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si planned_date existe, migrer vers scheduled_date puis supprimer planned_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'planned_date') THEN
        -- Migrer les données vers scheduled_date
        UPDATE deliveries SET scheduled_date = COALESCE(scheduled_date, planned_date, '') WHERE scheduled_date IS NULL OR scheduled_date = '';
        ALTER TABLE deliveries DROP COLUMN planned_date;
        RAISE NOTICE 'Migrated planned_date to scheduled_date in deliveries table';
    END IF;
    
    -- Si comments existe, migrer vers notes puis supprimer comments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'comments') THEN
        UPDATE deliveries SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE deliveries DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in deliveries table';
    END IF;
END $$;

-- S'assurer que scheduled_date n'est pas NULL
UPDATE deliveries SET scheduled_date = COALESCE(scheduled_date, '') WHERE scheduled_date IS NULL;
ALTER TABLE deliveries ALTER COLUMN scheduled_date SET NOT NULL;

-- 3. Ajouter les colonnes BL/Invoice si elles n'existent pas
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS bl_number TEXT,
ADD COLUMN IF NOT EXISTS bl_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoice_reference TEXT,
ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT FALSE;

-- 4. USER_GROUPS TABLE - Supprimer assigned_at et garder seulement la clé composite
DO $$
BEGIN
    -- Supprimer assigned_at si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_groups' AND column_name = 'assigned_at') THEN
        ALTER TABLE user_groups DROP COLUMN assigned_at;
    END IF;
    
    -- Supprimer la colonne id si elle existe (clé composite seulement)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_groups' AND column_name = 'id') THEN
        ALTER TABLE user_groups DROP COLUMN id;
    END IF;
END $$;

-- Ajouter la contrainte PRIMARY KEY composite si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_groups' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE user_groups ADD PRIMARY KEY (user_id, group_id);
    END IF;
END $$;

-- 5. VERIFICATION FINALE
SELECT 
    'SCHEMA VALIDATION' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') as orders_has_notes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'scheduled_date') as deliveries_has_scheduled_date,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'notes') as deliveries_has_notes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_groups' AND column_name = 'assigned_at') as user_groups_has_assigned_at;

-- Afficher la structure finale
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('orders', 'deliveries', 'user_groups')
ORDER BY table_name, ordinal_position;