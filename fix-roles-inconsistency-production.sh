#!/bin/bash

# Script pour corriger l'incohérence des rôles en production
# Problème: Utilisateur Rudolph MATTON apparaît comme "employé" dans page Rôles mais "Manager" dans page Utilisateurs

echo "🔍 Correction des incohérences de rôles en production..."

# 1. Vérifier les rôles actuels
echo "1. Vérification des rôles actuels:"
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username, 
    u.role as old_role_field,
    r.name as new_role_name,
    r.display_name,
    r.color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'directionfrouard_1752240832047'
ORDER BY u.username;
"

# 2. Corriger les couleurs des rôles
echo "2. Correction des couleurs des rôles:"
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
UPDATE roles SET color = '#ef4444' WHERE name = 'admin';
UPDATE roles SET color = '#3b82f6' WHERE name = 'manager';
UPDATE roles SET color = '#22c55e' WHERE name = 'employee';
UPDATE roles SET color = '#a855f7' WHERE name = 'directeur';
"

# 3. Synchroniser les rôles: utiliser le nouveau système comme référence
echo "3. Synchronisation des rôles (nouveau système prioritaire):"
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Mettre à jour le champ role dans la table users selon les assignations user_roles
UPDATE users 
SET role = r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE users.id = ur.user_id;
"

# 4. Vérifier les résultats
echo "4. Vérification des résultats:"
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    u.username, 
    u.role as synchronized_role,
    r.name as role_name,
    r.display_name,
    r.color
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

# 5. Redémarrer l'application pour vider le cache
echo "5. Redémarrage de l'application..."
docker restart logiflow_app

echo "✅ Correction terminée! Les rôles devraient maintenant être cohérents."
echo "📌 Note: Le bouton vert (UserCog) dans la page Utilisateurs permet d'attribuer les groupes."