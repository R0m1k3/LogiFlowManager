-- CORRECTION PRODUCTION : Ajout colonne 'name' manquante
-- Exécuter ce script sur la base PostgreSQL production

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        -- Ajouter la colonne name si elle n'existe pas
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Colonne "name" ajoutée avec succès à la table users';
    ELSE
        RAISE NOTICE 'Colonne "name" existe déjà dans la table users';
    END IF;
END $$;

-- Mettre à jour les utilisateurs existants qui n'ont pas de nom
UPDATE users 
SET name = COALESCE(username, email) 
WHERE name IS NULL OR name = '';

-- Vérifier le résultat
SELECT id, username, email, name, role 
FROM users 
ORDER BY created_at;