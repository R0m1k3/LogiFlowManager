-- Script pour corriger la table nocodb_config en production
-- Supprime les colonnes spécifiques aux magasins pour utiliser l'architecture hybride

-- Vérifier et supprimer les colonnes obsolètes si elles existent
DO $$
BEGIN
    -- Vérifier si les colonnes existent avant de les supprimer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'nocodb_config' AND column_name = 'table_id') THEN
        ALTER TABLE nocodb_config DROP COLUMN table_id;
        RAISE NOTICE 'Colonne table_id supprimée de nocodb_config';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'nocodb_config' AND column_name = 'table_name') THEN
        ALTER TABLE nocodb_config DROP COLUMN table_name;
        RAISE NOTICE 'Colonne table_name supprimée de nocodb_config';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'nocodb_config' AND column_name = 'invoice_column_name') THEN
        ALTER TABLE nocodb_config DROP COLUMN invoice_column_name;
        RAISE NOTICE 'Colonne invoice_column_name supprimée de nocodb_config';
    END IF;
    
    RAISE NOTICE 'Table nocodb_config mise à jour : configuration globale uniquement';
    RAISE NOTICE 'Configuration par magasin disponible dans la table groups';
END $$;

-- Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;