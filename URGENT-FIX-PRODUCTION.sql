-- SCRIPT D'URGENCE POUR CORRIGER LA PRODUCTION IMMÉDIATEMENT
-- ===========================================================

-- EXÉCUTER CE SCRIPT DIRECTEMENT :
-- docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < URGENT-FIX-PRODUCTION.sql

-- 1. AJOUTER LA COLONNE NOTES À ORDERS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. AJOUTER LES COLONNES MANQUANTES À DELIVERIES
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. MIGRER LES DONNÉES SI NÉCESSAIRE
UPDATE deliveries 
SET scheduled_date = planned_date::DATE 
WHERE scheduled_date IS NULL AND planned_date IS NOT NULL;

-- 4. VÉRIFICATION IMMÉDIATE
SELECT 
    'orders.notes' as column_check,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') as exists
UNION ALL
SELECT 
    'deliveries.scheduled_date',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='scheduled_date')
UNION ALL
SELECT 
    'deliveries.notes',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='notes');

-- FIN DU SCRIPT URGENT