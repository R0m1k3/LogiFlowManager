-- Script de correction des données de rôles en production
-- Exécuter avec: docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db -f fix-production-roles.sql

-- Afficher les données actuelles
SELECT 'DONNÉES ACTUELLES AVANT CORRECTION:' as status;
SELECT id, name, display_name, color, is_system, is_active FROM roles ORDER BY id;

-- Corriger les données de rôles avec les bonnes couleurs et noms
UPDATE roles SET 
    display_name = 'Administrateur',
    description = 'Accès complet à toutes les fonctionnalités du système',
    color = '#dc2626',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'admin';

UPDATE roles SET 
    display_name = 'Manager',
    description = 'Accès à la gestion des commandes, livraisons et fournisseurs',
    color = '#2563eb',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'manager';

UPDATE roles SET 
    display_name = 'Employé',
    description = 'Accès en lecture aux données et publicités',
    color = '#16a34a',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'employee';

UPDATE roles SET 
    display_name = 'Directeur',
    description = 'Direction générale et supervision',
    color = '#7c3aed',
    is_system = false,
    is_active = true,
    updated_at = NOW()
WHERE name = 'directeur';

-- Supprimer les rôles invalides s'ils existent
DELETE FROM user_roles WHERE role_id NOT IN (1, 2, 3, 4);
DELETE FROM role_permissions WHERE role_id NOT IN (1, 2, 3, 4);
DELETE FROM roles WHERE id NOT IN (1, 2, 3, 4);

-- Corriger les assignations de rôles corrompues
UPDATE user_roles 
SET assigned_by = 'admin_local', 
    assigned_at = NOW() 
WHERE assigned_by = 'system' AND user_id != 'admin_local';

-- Vérifier les corrections
SELECT 'RÔLES APRÈS CORRECTION:' as status;
SELECT id, name, display_name, color, is_system, is_active FROM roles ORDER BY id;

SELECT 'ASSIGNATIONS RÔLES APRÈS CORRECTION:' as status;
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;

-- Compter les rôles pour vérifier qu'il y en a exactement 4
SELECT 'NOMBRE DE RÔLES:' as status, COUNT(*) as count FROM roles;
SELECT 'NOMBRE D\'ASSIGNATIONS:' as status, COUNT(*) as count FROM user_roles;