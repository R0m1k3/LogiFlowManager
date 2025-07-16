-- CORRECTION URGENTE NOCODB PRODUCTION
-- Supprime les colonnes obsolètes causant l'erreur 500

BEGIN;

-- Suppression des colonnes qui causent les contraintes NOT NULL
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;

-- Vérification que la structure est correcte
SELECT 'Colonnes restantes dans nocodb_config:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;

COMMIT;

-- Message de confirmation
SELECT 'SUCCESS: Table nocodb_config corrigée - architecture hybride active' as result;