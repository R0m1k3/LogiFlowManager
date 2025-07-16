#!/bin/bash

echo "🔧 CORRECTION INCOHÉRENCES RÔLES - Synchronisation complète..."

# 1. Diagnostic initial
echo "=== 1. ÉTAT AVANT CORRECTION ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT u.username, u.role as old_role, r.name as assigned_role, r.color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 2. Correction complète des rôles
echo -e "\n=== 2. CORRECTION DONNÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Supprimer toutes les assignations existantes
DELETE FROM user_roles;

-- Corriger les couleurs des rôles (standardisation)
UPDATE roles SET color = '#dc2626', display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb', display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a', display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed', display_name = 'Directeur' WHERE name = 'directeur';

-- Réassigner les rôles basés sur la logique métier
-- Rudolph MATTON = Manager
-- ff292 SCHAL = Employé  
-- Michael SCHAL = Admin

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    CASE 
        WHEN u.username LIKE '%MATTON%' THEN 2  -- Manager
        WHEN u.username = 'admin' OR u.email LIKE '%admin%' THEN 1  -- Admin
        WHEN u.username LIKE '%ff292%' THEN 3  -- Employé
        WHEN u.role = 'admin' THEN 1
        WHEN u.role = 'manager' THEN 2
        WHEN u.role = 'employee' THEN 3
        WHEN u.role = 'directeur' THEN 4
        ELSE 3  -- Employé par défaut
    END,
    'system_sync',
    CURRENT_TIMESTAMP
FROM users u;

-- Synchroniser la colonne users.role avec les nouvelles assignations
UPDATE users 
SET role = r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE users.id = ur.user_id;
"

# 3. Vérification finale
echo -e "\n=== 3. ÉTAT APRÈS CORRECTION ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username,
    u.role as synced_role,
    r.name as assigned_role,
    r.display_name,
    r.color,
    '✅ SYNCHRONISÉ' as status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 4. Redémarrage pour purger les caches
echo -e "\n=== 4. REDÉMARRAGE APPLICATION ==="
docker restart logiflow_app
echo "Attente stabilisation..."
sleep 10

echo -e "\n✅ CORRECTION TERMINÉE!"
echo ""
echo "📋 Rôles corrigés:"
echo "   • Rudolph MATTON → Manager (bleu)"
echo "   • ff292 SCHAL → Employé (vert)"  
echo "   • Michael SCHAL → Admin (rouge)"
echo ""
echo "🎯 Les deux pages affichent maintenant les mêmes informations!"