-- NETTOYAGE COMPLET DES DONNÉES DE RÔLES CORROMPUES EN PRODUCTION
-- LogiFlow - Réinitialisation complète des rôles avec IDs corrects

BEGIN;

-- Sauvegarder les assignations existantes avant suppression
CREATE TEMP TABLE temp_user_roles AS 
SELECT user_id, 
       CASE 
         WHEN role_id = 2 THEN 1  -- admin ID 2 -> 1
         WHEN role_id = 3 THEN 2  -- manager ID 3 -> 2  
         WHEN role_id = 4 THEN 3  -- employee ID 4 -> 3
         WHEN role_id = 6 THEN 4  -- directeur ID 6 -> 4
         ELSE 1 -- default to admin
       END as new_role_id,
       assigned_by,
       assigned_at
FROM user_roles;

SELECT 'SAUVEGARDE ASSIGNATIONS:' as status;
SELECT * FROM temp_user_roles;

-- Supprimer toutes les données corrompues
DELETE FROM user_roles;
DELETE FROM role_permissions; 
DELETE FROM roles;
DELETE FROM permissions;

-- Réinitialiser les séquences
SELECT setval('roles_id_seq', 1, false);
SELECT setval('permissions_id_seq', 1, false);

-- Recréer les rôles avec les bons IDs et couleurs
INSERT INTO roles (id, name, display_name, description, color, is_system, is_active) VALUES
(1, 'admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités du système', '#dc2626', true, true),
(2, 'manager', 'Manager', 'Gestion des équipes et supervision des opérations', '#2563eb', true, true),
(3, 'employee', 'Employé', 'Accès aux fonctionnalités de base et saisie de données', '#16a34a', true, true),
(4, 'directeur', 'Directeur', 'Direction et supervision générale', '#7c3aed', true, true);

-- Mettre à jour la séquence
SELECT setval('roles_id_seq', 4, true);

-- Recréer les permissions système (version simplifiée pour test)
INSERT INTO permissions (name, display_name, description, category, action, resource, is_system) VALUES
-- Dashboard
('dashboard_read', 'Voir tableau de bord', 'Accès au tableau de bord principal', 'dashboard', 'read', 'dashboard', true),

-- Orders  
('orders_read', 'Voir commandes', 'Accès en lecture aux commandes', 'orders', 'read', 'orders', true),
('orders_create', 'Créer commandes', 'Création de nouvelles commandes', 'orders', 'create', 'orders', true),
('orders_update', 'Modifier commandes', 'Modification des commandes existantes', 'orders', 'update', 'orders', true),
('orders_delete', 'Supprimer commandes', 'Suppression de commandes', 'orders', 'delete', 'orders', true),

-- Deliveries
('deliveries_read', 'Voir livraisons', 'Accès en lecture aux livraisons', 'deliveries', 'read', 'deliveries', true),
('deliveries_create', 'Créer livraisons', 'Création de nouvelles livraisons', 'deliveries', 'create', 'deliveries', true),
('deliveries_update', 'Modifier livraisons', 'Modification des livraisons existantes', 'deliveries', 'update', 'deliveries', true),
('deliveries_delete', 'Supprimer livraisons', 'Suppression de livraisons', 'deliveries', 'delete', 'deliveries', true),
('deliveries_validate', 'Valider livraisons', 'Validation des livraisons', 'deliveries', 'validate', 'deliveries', true),

-- Users
('users_read', 'Voir utilisateurs', 'Accès en lecture aux utilisateurs', 'users', 'read', 'users', true),
('users_create', 'Créer utilisateurs', 'Création de nouveaux utilisateurs', 'users', 'create', 'users', true),
('users_update', 'Modifier utilisateurs', 'Modification des utilisateurs existants', 'users', 'update', 'users', true),
('users_delete', 'Supprimer utilisateurs', 'Suppression d''utilisateurs', 'users', 'delete', 'users', true),

-- Roles
('roles_read', 'Voir rôles', 'Accès en lecture aux rôles', 'roles', 'read', 'roles', true),
('roles_create', 'Créer rôles', 'Création de nouveaux rôles', 'roles', 'create', 'roles', true),
('roles_update', 'Modifier rôles', 'Modification des rôles existants', 'roles', 'update', 'roles', true),
('roles_delete', 'Supprimer rôles', 'Suppression de rôles', 'roles', 'delete', 'roles', true),
('roles_assign', 'Assigner rôles', 'Attribution de rôles aux utilisateurs', 'roles', 'assign', 'roles', true);

-- Assigner toutes les permissions aux administrateurs
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assigner permissions limitées aux autres rôles
-- Manager : orders, deliveries, users (lecture et modification)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE name IN ('dashboard_read', 'orders_read', 'orders_create', 'orders_update', 
               'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_validate',
               'users_read');

-- Employee : lecture seulement + création commandes/livraisons
INSERT INTO role_permissions (role_id, permission_id)  
SELECT 3, id FROM permissions
WHERE name IN ('dashboard_read', 'orders_read', 'orders_create', 
               'deliveries_read', 'deliveries_create');

-- Directeur : comme admin mais sans gestion technique
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE name NOT IN ('roles_create', 'roles_update', 'roles_delete', 'users_delete');

-- Restaurer les assignations utilisateurs avec les nouveaux IDs
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT user_id, new_role_id, assigned_by, assigned_at 
FROM temp_user_roles;

COMMIT;

-- Vérifications finales
SELECT 'RÔLES APRÈS RÉINITIALISATION:' as status;
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

SELECT 'PERMISSIONS FINALES:' as status;
SELECT COUNT(*) as total_permissions FROM permissions;

SELECT 'ASSIGNATIONS RÔLES:' as status;
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;