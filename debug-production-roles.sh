#!/bin/bash

echo "🔍 DIAGNOSTIC INCOHÉRENCES RÔLES - Production..."

# 1. État exact des rôles en base de données
echo "=== 1. ÉTAT COMPLET BASE DE DONNÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    '=== UTILISATEURS ===',
    u.username,
    u.role as old_role_column,
    ur.role_id as assigned_role_id,
    r.name as assigned_role_name,
    r.display_name as role_display,
    r.color as role_color,
    CASE 
        WHEN ur.role_id IS NULL THEN '❌ AUCUN_ROLE_ASSIGNE'
        WHEN u.role != r.name THEN '⚠️ INCOHERENT'
        ELSE '✅ COHERENT'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 2. État des rôles système
echo -e "\n=== 2. RÔLES SYSTÈME ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT id, name, display_name, color, description 
FROM roles 
ORDER BY id;
"

# 3. Toutes les assignations de rôles
echo -e "\n=== 3. ASSIGNATIONS RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    ur.user_id,
    u.username,
    ur.role_id,
    r.name as role_name,
    ur.assigned_by,
    ur.assigned_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 4. Incohérences spécifiques
echo -e "\n=== 4. INCOHÉRENCES DÉTAILLÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    'PROBLÈME: ' || u.username as issue,
    'Page Utilisateurs: ' || COALESCE(u.role, 'NULL') as page_users,
    'Page Rôles: ' || COALESCE(r.name, 'AUCUN') as page_roles,
    'Solution: Synchroniser vers ' || COALESCE(r.name, u.role) as solution
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.role != r.name OR ur.role_id IS NULL OR u.role IS NULL;
"

echo -e "\n✅ Diagnostic terminé. Analysez les incohérences ci-dessus."