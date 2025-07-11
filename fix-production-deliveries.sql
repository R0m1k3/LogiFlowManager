-- Fix production database deliveries table schema
-- Problème: contrainte deliveries_status_check incorrecte en production

-- 1. Identifier et supprimer les contraintes problématiques
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Trouver toutes les contraintes CHECK sur la table deliveries
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'deliveries'::regclass 
        AND contype = 'c'
        AND conname LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE deliveries DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- 2. Supprimer l'ancienne colonne planned_date si elle existe encore
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'planned_date'
    ) THEN
        -- Copier les données vers scheduled_date si nécessaire
        UPDATE deliveries 
        SET scheduled_date = planned_date::text::date 
        WHERE scheduled_date IS NULL AND planned_date IS NOT NULL;
        
        -- Supprimer la colonne
        ALTER TABLE deliveries DROP COLUMN planned_date;
        RAISE NOTICE 'Removed planned_date column';
    END IF;
END $$;

-- 3. S'assurer que scheduled_date est au bon format
DO $$
BEGIN
    -- Convertir en DATE si c'est TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'scheduled_date' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE deliveries ALTER COLUMN scheduled_date TYPE DATE USING scheduled_date::date;
        RAISE NOTICE 'Converted scheduled_date to DATE type';
    END IF;
END $$;

-- 4. Ajouter les bonnes contraintes
ALTER TABLE deliveries 
ADD CONSTRAINT deliveries_status_check_fixed 
CHECK (status IN ('planned', 'delivered'));

ALTER TABLE deliveries 
ADD CONSTRAINT deliveries_unit_check_fixed 
CHECK (unit IN ('palettes', 'colis'));

-- 5. Vérification finale
DO $$
BEGIN
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    RAISE NOTICE 'Colonnes deliveries:';
    
    -- Afficher les colonnes
    PERFORM column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'deliveries' 
    ORDER BY ordinal_position;
    
    RAISE NOTICE 'Contraintes CHECK:';
    
    -- Afficher les contraintes
    PERFORM conname 
    FROM pg_constraint 
    WHERE conrelid = 'deliveries'::regclass 
    AND contype = 'c';
    
    RAISE NOTICE '=== FIN VÉRIFICATION ===';
END $$;