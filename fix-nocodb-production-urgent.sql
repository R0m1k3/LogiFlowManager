-- Fix NocoDB Configuration Production Issue
-- Problème: TypeError "Cannot read properties of undefined (reading 'length')"

-- Vérification de la table nocodb_config
SELECT 
  COUNT(*) as total_configs,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_configs
FROM nocodb_config;

-- Vérification de la structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;

-- Ajout de configurations de test si la table est vide
INSERT INTO nocodb_config (
  name, 
  base_url, 
  project_id, 
  api_token, 
  description, 
  is_active, 
  created_by, 
  created_at, 
  updated_at
) VALUES 
  ('Configuration Test', 'https://test.nocodb.com', 'test-project', 'test-token', 'Configuration de test', true, 'admin_local', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Vérification finale
SELECT id, name, base_url, is_active, created_at 
FROM nocodb_config 
ORDER BY created_at DESC 
LIMIT 5;