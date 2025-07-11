-- SCRIPT DE CORRECTION PRODUCTION URGENTE
-- =======================================
-- Ce script doit être exécuté sur la base de production pour corriger le schéma

-- 1. ORDERS TABLE - Ajouter colonne notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si comments existe, migrer vers notes puis supprimer comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'comments') THEN
        UPDATE orders SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE orders DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in orders table';
    END IF;
END $$;

-- 2. DELIVERIES TABLE - Ajouter colonnes manquantes
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS scheduled_date TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si planned_date existe, migrer vers scheduled_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'planned_date') THEN
        UPDATE deliveries SET scheduled_date = planned_date::TEXT 
        WHERE (scheduled_date IS NULL OR scheduled_date = '') AND planned_date IS NOT NULL;
        RAISE NOTICE 'Migrated planned_date to scheduled_date in deliveries table';
    END IF;
    
    -- Si comments existe, migrer vers notes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'comments') THEN
        UPDATE deliveries SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE deliveries DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in deliveries table';
    END IF;
END $$;

-- S'assurer que scheduled_date n'est pas NULL
UPDATE deliveries SET scheduled_date = COALESCE(scheduled_date, '2025-01-01') 
WHERE scheduled_date IS NULL OR scheduled_date = '';
ALTER TABLE deliveries ALTER COLUMN scheduled_date SET NOT NULL;

-- 3. Vérification finale
SELECT 'orders' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'notes'
UNION ALL
SELECT 'deliveries' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'deliveries' AND column_name IN ('notes', 'scheduled_date')
ORDER BY table_name, column_name;

-- COMMANDES DE DÉPLOIEMENT PRODUCTION :
-- docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < apply-production-schema.sql
-- docker restart logiflow-app