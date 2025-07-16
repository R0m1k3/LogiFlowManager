#!/bin/bash

echo "🔍 Diagnostic complet des rôles en production..."

# 1. État actuel des rôles
echo "=== ÉTAT ACTUEL DES RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    r.id,
    r.name,
    r.display_name,
    r.color,
    r.description,
    r.is_active
FROM roles r
ORDER BY r.id;
"

# 2. Assignations des rôles aux utilisateurs
echo "=== ASSIGNATIONS DES RÔLES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as old_role_field,
    r.name as assigned_role,
    r.display_name,
    r.color,
    ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 3. Groupes assignés aux utilisateurs
echo "=== GROUPES ASSIGNÉS AUX UTILISATEURS ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    g.name as group_name,
    g.color as group_color
FROM users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
ORDER BY u.username, g.name;
"

# 4. Vérifier les incohérences
echo "=== INCOHÉRENCES DÉTECTÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as old_system_role,
    r.name as new_system_role,
    CASE 
        WHEN u.role != r.name THEN 'INCOHÉRENT'
        ELSE 'COHÉRENT'
    END as status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.role != r.name;
"

echo "✅ Diagnostic terminé!"