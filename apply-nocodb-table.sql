-- Migration urgente pour créer la table nocodb_configs
-- Date: 2025-07-14
-- Fix: relation "nocodb_configs" does not exist

BEGIN;

-- Créer la table nocodb_configs si elle n'existe pas
CREATE TABLE IF NOT EXISTS nocodb_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter les colonnes NocoDB dans groups si elles n'existent pas
DO $$
BEGIN
    -- Ajouter nocodb_config_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_config_id') THEN
        ALTER TABLE groups ADD COLUMN nocodb_config_id INTEGER REFERENCES nocodb_configs(id);
        RAISE NOTICE 'Colonne nocodb_config_id ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_config_id existe déjà dans groups';
    END IF;

    -- Ajouter nocodb_table_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_table_id') THEN
        ALTER TABLE groups ADD COLUMN nocodb_table_id VARCHAR(255);
        RAISE NOTICE 'Colonne nocodb_table_id ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_table_id existe déjà dans groups';
    END IF;

    -- Ajouter nocodb_table_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'nocodb_table_name') THEN
        ALTER TABLE groups ADD COLUMN nocodb_table_name VARCHAR(255);
        RAISE NOTICE 'Colonne nocodb_table_name ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne nocodb_table_name existe déjà dans groups';
    END IF;

    -- Ajouter invoice_column_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'invoice_column_name') THEN
        ALTER TABLE groups ADD COLUMN invoice_column_name VARCHAR(255) DEFAULT 'RefFacture';
        RAISE NOTICE 'Colonne invoice_column_name ajoutée à la table groups';
    ELSE
        RAISE NOTICE 'Colonne invoice_column_name existe déjà dans groups';
    END IF;
END $$;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_name ON nocodb_configs(name);
CREATE INDEX IF NOT EXISTS idx_nocodb_configs_active ON nocodb_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_nocodb_config ON groups(nocodb_config_id);

COMMIT;

-- Vérification
SELECT 
    'nocodb_configs' as table_name,
    COUNT(*) as exists_count
FROM information_schema.tables 
WHERE table_name = 'nocodb_configs';

RAISE NOTICE '=== TABLE NOCODB_CONFIGS CRÉÉE AVEC SUCCÈS ===';
RAISE NOTICE 'La table nocodb_configs est maintenant disponible';
RAISE NOTICE 'Les colonnes NocoDB ont été ajoutées à la table groups';
RAISE NOTICE 'Vous pouvez maintenant créer des configurations NocoDB';