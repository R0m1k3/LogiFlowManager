-- SCRIPT DE CORRECTION COMPLET POUR PRODUCTION
-- =============================================
-- Ce script corrige TOUTES les incohérences entre le code et la base de données

-- 1. DÉSACTIVER LES CONTRAINTES TEMPORAIREMENT
BEGIN;

-- 2. CORRECTION TABLE ORDERS
-- -------------------------
-- S'assurer que la colonne notes existe
DO $$
BEGIN
    -- Ajouter notes si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to orders table';
    END IF;
    
    -- Si comments existe, migrer puis supprimer
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'comments') THEN
        UPDATE orders SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE orders DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in orders table';
    END IF;
END $$;

-- 3. CORRECTION TABLE DELIVERIES
-- ------------------------------
DO $$
BEGIN
    -- Supprimer l'ancienne colonne scheduled_date TEXT si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'deliveries' AND column_name = 'scheduled_date' AND data_type = 'text') THEN
        ALTER TABLE deliveries DROP COLUMN scheduled_date;
        RAISE NOTICE 'Dropped old scheduled_date TEXT column';
    END IF;
    
    -- Renommer planned_date en scheduled_date si nécessaire
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'planned_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'scheduled_date') THEN
        ALTER TABLE deliveries RENAME COLUMN planned_date TO scheduled_date;
        RAISE NOTICE 'Renamed planned_date to scheduled_date';
    END IF;
    
    -- Si scheduled_date n'existe toujours pas, la créer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'scheduled_date') THEN
        ALTER TABLE deliveries ADD COLUMN scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added scheduled_date column to deliveries table';
    END IF;
    
    -- Ajouter notes si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'notes') THEN
        ALTER TABLE deliveries ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to deliveries table';
    END IF;
    
    -- Si comments existe, migrer puis supprimer
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'comments') THEN
        UPDATE deliveries SET notes = COALESCE(notes, comments, '') WHERE notes IS NULL OR notes = '';
        ALTER TABLE deliveries DROP COLUMN comments;
        RAISE NOTICE 'Migrated comments to notes in deliveries table';
    END IF;
END $$;

-- 4. CORRECTION COLONNES BL/FACTURES
-- ----------------------------------
DO $$
BEGIN
    -- Ajouter les colonnes BL/Factures si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'bl_number') THEN
        ALTER TABLE deliveries ADD COLUMN bl_number VARCHAR;
        RAISE NOTICE 'Added bl_number column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'bl_amount') THEN
        ALTER TABLE deliveries ADD COLUMN bl_amount NUMERIC(10,2);
        RAISE NOTICE 'Added bl_amount column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'invoice_reference') THEN
        ALTER TABLE deliveries ADD COLUMN invoice_reference VARCHAR;
        RAISE NOTICE 'Added invoice_reference column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'invoice_amount') THEN
        ALTER TABLE deliveries ADD COLUMN invoice_amount NUMERIC(10,2);
        RAISE NOTICE 'Added invoice_amount column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'reconciled') THEN
        ALTER TABLE deliveries ADD COLUMN reconciled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added reconciled column';
    END IF;
END $$;

-- 5. VÉRIFICATION TYPES DE DONNÉES
-- --------------------------------
-- S'assurer que planned_date est bien DATE dans orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = 'planned_date' AND data_type != 'date') THEN
        -- Créer colonne temporaire
        ALTER TABLE orders ADD COLUMN planned_date_temp DATE;
        -- Copier les données avec conversion
        UPDATE orders SET planned_date_temp = planned_date::DATE;
        -- Supprimer ancienne colonne
        ALTER TABLE orders DROP COLUMN planned_date;
        -- Renommer la nouvelle
        ALTER TABLE orders RENAME COLUMN planned_date_temp TO planned_date;
        -- Ajouter NOT NULL
        ALTER TABLE orders ALTER COLUMN planned_date SET NOT NULL;
        RAISE NOTICE 'Fixed planned_date type in orders';
    END IF;
END $$;

-- 6. VÉRIFICATION COLONNES USERS
-- ------------------------------
DO $$
BEGIN
    -- Ajouter la colonne name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR;
        UPDATE users SET name = COALESCE(username, email) WHERE name IS NULL OR name = '';
        RAISE NOTICE 'Added name column to users table';
    END IF;
END $$;

-- 7. VALIDATION FINALE
-- -------------------
COMMIT;

-- 8. AFFICHAGE DU SCHÉMA FINAL
-- ----------------------------
\echo ''
\echo '======================================'
\echo 'VÉRIFICATION DU SCHÉMA APRÈS CORRECTION'
\echo '======================================'
\echo ''

-- Vérifier orders
\echo 'TABLE ORDERS:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('notes', 'planned_date', 'status', 'created_by')
ORDER BY column_name;

\echo ''
\echo 'TABLE DELIVERIES:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deliveries' AND column_name IN ('notes', 'scheduled_date', 'bl_number', 'bl_amount', 'status')
ORDER BY column_name;

\echo ''
\echo 'TABLE USERS:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('name', 'username', 'email', 'role')
ORDER BY column_name;

\echo ''
\echo '✅ CORRECTION TERMINÉE - Base de données prête pour la production !'