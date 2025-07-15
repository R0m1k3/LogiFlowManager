-- Migration base de données Production - LogiFlow
-- Correction colonnes manquantes dans la table users

-- 1. Vérifier les colonnes existantes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter first_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
        RAISE NOTICE 'Colonne first_name ajoutée';
    END IF;
    
    -- Ajouter last_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
        RAISE NOTICE 'Colonne last_name ajoutée';
    END IF;
    
    -- Ajouter profile_image_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
        RAISE NOTICE 'Colonne profile_image_url ajoutée';
    END IF;
END $$;

-- 3. Migrer les données existantes
-- Extraire firstName et lastName depuis le champ name existant
UPDATE users 
SET 
    first_name = CASE 
        WHEN name IS NOT NULL AND name != '' THEN SPLIT_PART(name, ' ', 1)
        ELSE username
    END,
    last_name = CASE 
        WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN SPLIT_PART(name, ' ', 2)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- 4. Vérifier les données migrées
SELECT id, username, name, first_name, last_name, email 
FROM users 
ORDER BY username;

-- 5. Ajouter les contraintes NOT NULL si nécessaire
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;

-- 6. Vérification finale du schéma
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;