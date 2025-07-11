-- CORRECTION D'URGENCE DU SCHÉMA PRODUCTION
-- ==========================================
-- Ce script corrige TOUS les problèmes de schéma détectés

-- 1. ORDERS TABLE - Ajouter la colonne 'notes' si elle n'existe pas
DO $$
BEGIN
    -- Vérifier et ajouter 'notes' à orders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Added column notes to orders table';
    ELSE
        RAISE NOTICE '✓ Column notes already exists in orders table';
    END IF;
END $$;

-- 2. DELIVERIES TABLE - Vérifier la colonne scheduled_date
DO $$
BEGIN
    -- Si ni scheduled_date ni planned_date n'existent, créer scheduled_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'scheduled_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'planned_date'
    ) THEN
        ALTER TABLE deliveries ADD COLUMN scheduled_date TEXT NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Added column scheduled_date to deliveries table';
    -- Si planned_date existe mais pas scheduled_date, renommer
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'planned_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'scheduled_date'
    ) THEN
        ALTER TABLE deliveries RENAME COLUMN planned_date TO scheduled_date;
        RAISE NOTICE '✅ Renamed column planned_date to scheduled_date in deliveries table';
    ELSE
        RAISE NOTICE '✓ Column scheduled_date already exists in deliveries table';
    END IF;
    
    -- Ajouter la colonne 'notes' à deliveries si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'notes'
    ) THEN
        ALTER TABLE deliveries ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Added column notes to deliveries table';
    END IF;
END $$;

-- 3. USER_GROUPS TABLE - Supprimer assigned_at si elle existe encore
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_groups' AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE user_groups DROP COLUMN assigned_at;
        RAISE NOTICE '✅ Dropped column assigned_at from user_groups table';
    END IF;
END $$;

-- 4. VERIFICATION FINALE - Afficher l'état du schéma
SELECT 
    'ORDERS' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') as has_notes_column
UNION ALL
SELECT 
    'DELIVERIES' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'scheduled_date') as has_scheduled_date_column;

-- 5. LISTE DES COLONNES ACTUELLES
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'deliveries', 'user_groups')
ORDER BY table_name, ordinal_position;