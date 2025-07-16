-- =========================================
-- CORRECTION URGENTE NOCODB PRODUCTION
-- =========================================
-- Suppression des colonnes obsolètes avec contraintes NOT NULL
-- qui causent l'erreur 500 lors de la création des configurations

-- Étape 1: Vérification de la structure actuelle
SELECT 'STRUCTURE ACTUELLE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;

-- Étape 2: Sauvegarde des données existantes
SELECT 'SAUVEGARDE DES DONNÉES EXISTANTES:' as info;
SELECT COUNT(*) as total_configs FROM nocodb_config;

-- Étape 3: Suppression des colonnes obsolètes
SELECT 'SUPPRESSION DES COLONNES OBSOLÈTES...' as info;

-- Suppression sécurisée des colonnes obsolètes
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;

-- Étape 4: Vérification de la structure finale
SELECT 'STRUCTURE FINALE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;

-- Étape 5: Test d'insertion pour vérifier la correction
SELECT 'TEST D''INSERTION...' as info;
INSERT INTO nocodb_config (
  name, base_url, project_id, api_token, description, is_active, created_by
) VALUES (
  'Test Correction', 
  'https://test.nocodb.com', 
  'test_project_id', 
  'test_token_12345', 
  'Test de correction du problème', 
  true, 
  'admin_local'
);

-- Vérification que l'insertion a réussi
SELECT 'INSERTION RÉUSSIE - ID:' as info, id FROM nocodb_config WHERE name = 'Test Correction';

-- Suppression du test
DELETE FROM nocodb_config WHERE name = 'Test Correction';

-- Étape 6: Validation finale
SELECT 'VALIDATION FINALE:' as info;
SELECT 'La table nocodb_config a été corrigée avec succès!' as resultat;
SELECT 'Colonnes présentes:' as info;
SELECT array_agg(column_name) as colonnes_restantes
FROM information_schema.columns 
WHERE table_name = 'nocodb_config';

-- Statistiques finales
SELECT 'STATISTIQUES FINALES:' as info;
SELECT COUNT(*) as configurations_existantes FROM nocodb_config;