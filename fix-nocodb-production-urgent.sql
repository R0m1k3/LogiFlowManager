-- CORRECTION URGENTE - Vérification base de données NocoDB
-- Diagnostic complet pour identifier les problèmes de données

-- 1. Vérifier la structure de la table nocodb_configs
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'nocodb_configs'
ORDER BY ordinal_position;

-- 2. Vérifier le contenu de la table
SELECT 
    id,
    name,
    base_url,
    project_id,
    api_token,
    description,
    is_active,
    created_by,
    created_at,
    updated_at
FROM nocodb_configs
ORDER BY id;

-- 3. Compter les enregistrements
SELECT 
    COUNT(*) as total_configs,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_configs,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_configs
FROM nocodb_configs;

-- 4. Vérifier les références dans la table groups
SELECT 
    g.id,
    g.name,
    g.nocodb_config_id,
    nc.name as nocodb_config_name,
    nc.is_active as config_is_active
FROM groups g
LEFT JOIN nocodb_configs nc ON g.nocodb_config_id = nc.id
WHERE g.nocodb_config_id IS NOT NULL;

-- 5. Diagnostic des problèmes potentiels
-- Vérifier s'il y a des valeurs NULL inattendues
SELECT 
    'nocodb_configs' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as null_names,
    COUNT(CASE WHEN base_url IS NULL THEN 1 END) as null_base_urls,
    COUNT(CASE WHEN api_token IS NULL THEN 1 END) as null_api_tokens,
    COUNT(CASE WHEN project_id IS NULL THEN 1 END) as null_project_ids
FROM nocodb_configs;

-- 6. Vérifier les contraintes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confupdtype as on_update,
    confdeltype as on_delete
FROM pg_constraint 
WHERE conrelid = 'nocodb_configs'::regclass;

-- 7. Test d'insertion pour identifier les problèmes
-- (Commenté pour éviter les modifications accidentelles)
-- INSERT INTO nocodb_configs (name, base_url, project_id, api_token, description, is_active, created_by)
-- VALUES ('Test', 'https://test.example.com', 'test_project', 'test_token', 'Test config', true, 'admin_local');

-- 8. Vérifier les permissions sur la table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'nocodb_configs';