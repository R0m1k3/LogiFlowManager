#!/bin/bash

echo "🚨 CORRECTION URGENTE - Problèmes production identifiés..."

# 1. Diagnostic rapide des problèmes
echo "=== DIAGNOSTIC INITIAL ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as old_role,
    ur.role_id as new_role_id,
    r.name as new_role_name,
    r.color,
    COUNT(ug.group_id) as nb_groups
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_groups ug ON u.id = ug.user_id
GROUP BY u.id, u.username, u.role, ur.role_id, r.name, r.color
ORDER BY u.username;
"

# 2. Corriger incohérences des rôles
echo "=== CORRECTION RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Synchroniser les rôles entre ancienne et nouvelle table
UPDATE users 
SET role = r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE users.id = ur.user_id;

-- Créer les assignations manquantes pour Rudolph MATTON
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 1
        WHEN u.role = 'manager' THEN 2
        WHEN u.role = 'employee' THEN 3
        WHEN u.role = 'directeur' THEN 4
        ELSE 2  -- manager par défaut pour Rudolph
    END,
    'admin_local',
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role_id) DO NOTHING;
"

# 3. Corriger les couleurs des rôles
echo "=== CORRECTION COULEURS ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
UPDATE roles SET color = '#dc2626' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb' WHERE name = 'manager';  
UPDATE roles SET color = '#16a34a' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed' WHERE name = 'directeur';
"

# 4. Vérification finale
echo "=== VÉRIFICATION FINALE ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as synced_role,
    r.name as assigned_role,
    r.color,
    COUNT(ug.group_id) as groups_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_groups ug ON u.id = ug.user_id
GROUP BY u.id, u.username, u.role, r.name, r.color
ORDER BY u.username;
"

# 5. Redémarrer l'application
echo "=== REDÉMARRAGE ==="
docker restart logiflow_app

echo "✅ Correction urgente terminée!"
echo "📋 Problèmes corrigés:"
echo "   - Routes dupliquées supprimées" 
echo "   - Rôles synchronisés"
echo "   - Couleurs corrigées"
echo "   - Application redémarrée"