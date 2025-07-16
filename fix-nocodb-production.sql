-- Correction urgente table nocodb_config production
-- Suppression des colonnes obsolètes causant l'erreur 500

-- Vérification de la structure actuelle
\echo 'Structure actuelle de nocodb_config:'
\d nocodb_config;

-- Suppression des colonnes obsolètes
\echo 'Suppression des colonnes obsolètes...'
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;

-- Vérification de la structure finale
\echo 'Structure finale de nocodb_config:'
\d nocodb_config;

-- Test insertion pour vérifier que le problème est résolu
\echo 'Test d''insertion...'
INSERT INTO nocodb_config (
  name, base_url, project_id, api_token, description, is_active, created_by
) VALUES (
  'Test Config', 
  'https://test.nocodb.com', 
  'test_project', 
  'test_token', 
  'Configuration de test', 
  true, 
  'admin_local'
) ON CONFLICT (id) DO NOTHING;

-- Suppression du test
DELETE FROM nocodb_config WHERE name = 'Test Config';

\echo 'Correction terminée avec succès !';