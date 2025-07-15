-- Script de correction forcée des données de production
-- EXÉCUTER DIRECTEMENT EN PRODUCTION

-- 1. Supprimer toutes les données existantes pour repartir à zéro
DELETE FROM user_roles;
DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM roles;

-- 2. Recréer les rôles avec les bonnes données
INSERT INTO roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES
(1, 'admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités du système', '#dc2626', true, true, NOW(), NOW()),
(2, 'manager', 'Manager', 'Accès à la gestion des commandes, livraisons et fournisseurs', '#2563eb', true, true, NOW(), NOW()),
(3, 'employee', 'Employé', 'Accès en lecture aux données et publicités', '#16a34a', true, true, NOW(), NOW()),
(4, 'directeur', 'Directeur', 'Direction générale et supervision', '#7c3aed', false, true, NOW(), NOW());

-- 3. Recréer les permissions
INSERT INTO permissions (id, category, name, display_name, description, action, resource, is_system, created_at, updated_at) VALUES
(1, 'dashboard', 'dashboard_read', 'Voir tableau de bord', 'Accès en lecture au tableau de bord', 'read', 'dashboard', true, NOW(), NOW()),
(2, 'groups', 'groups_read', 'Voir magasins', 'Accès en lecture aux magasins', 'read', 'groups', true, NOW(), NOW()),
(3, 'groups', 'groups_create', 'Créer magasins', 'Création de nouveaux magasins', 'create', 'groups', true, NOW(), NOW()),
(4, 'groups', 'groups_update', 'Modifier magasins', 'Modification des magasins existants', 'update', 'groups', true, NOW(), NOW()),
(5, 'groups', 'groups_delete', 'Supprimer magasins', 'Suppression de magasins', 'delete', 'groups', true, NOW(), NOW()),
(6, 'suppliers', 'suppliers_read', 'Voir fournisseurs', 'Accès en lecture aux fournisseurs', 'read', 'suppliers', true, NOW(), NOW()),
(7, 'suppliers', 'suppliers_create', 'Créer fournisseurs', 'Création de nouveaux fournisseurs', 'create', 'suppliers', true, NOW(), NOW()),
(8, 'suppliers', 'suppliers_update', 'Modifier fournisseurs', 'Modification des fournisseurs existants', 'update', 'suppliers', true, NOW(), NOW()),
(9, 'suppliers', 'suppliers_delete', 'Supprimer fournisseurs', 'Suppression de fournisseurs', 'delete', 'suppliers', true, NOW(), NOW()),
(10, 'orders', 'orders_read', 'Voir commandes', 'Accès en lecture aux commandes', 'read', 'orders', true, NOW(), NOW()),
(11, 'orders', 'orders_create', 'Créer commandes', 'Création de nouvelles commandes', 'create', 'orders', true, NOW(), NOW()),
(12, 'orders', 'orders_update', 'Modifier commandes', 'Modification des commandes existantes', 'update', 'orders', true, NOW(), NOW()),
(13, 'orders', 'orders_delete', 'Supprimer commandes', 'Suppression de commandes', 'delete', 'orders', true, NOW(), NOW()),
(14, 'deliveries', 'deliveries_read', 'Voir livraisons', 'Accès en lecture aux livraisons', 'read', 'deliveries', true, NOW(), NOW()),
(15, 'deliveries', 'deliveries_create', 'Créer livraisons', 'Création de nouvelles livraisons', 'create', 'deliveries', true, NOW(), NOW()),
(16, 'deliveries', 'deliveries_update', 'Modifier livraisons', 'Modification des livraisons existantes', 'update', 'deliveries', true, NOW(), NOW()),
(17, 'deliveries', 'deliveries_delete', 'Supprimer livraisons', 'Suppression de livraisons', 'delete', 'deliveries', true, NOW(), NOW()),
(18, 'deliveries', 'deliveries_validate', 'Valider livraisons', 'Validation des livraisons avec BL', 'validate', 'deliveries', true, NOW(), NOW()),
(19, 'calendar', 'calendar_read', 'Voir calendrier', 'Accès en lecture au calendrier', 'read', 'calendar', true, NOW(), NOW()),
(20, 'reconciliation', 'reconciliation_read', 'Voir rapprochement', 'Accès en lecture au rapprochement BL/Factures', 'read', 'reconciliation', true, NOW(), NOW()),
(21, 'reconciliation', 'reconciliation_update', 'Modifier rapprochement', 'Modification des données de rapprochement', 'update', 'reconciliation', true, NOW(), NOW()),
(22, 'publicities', 'publicities_read', 'Voir publicités', 'Accès en lecture aux publicités', 'read', 'publicities', true, NOW(), NOW()),
(23, 'publicities', 'publicities_create', 'Créer publicités', 'Création de nouvelles publicités', 'create', 'publicities', true, NOW(), NOW()),
(24, 'publicities', 'publicities_update', 'Modifier publicités', 'Modification des publicités existantes', 'update', 'publicities', true, NOW(), NOW()),
(25, 'publicities', 'publicities_delete', 'Supprimer publicités', 'Suppression de publicités', 'delete', 'publicities', true, NOW(), NOW()),
(26, 'customer_orders', 'customer_orders_read', 'Voir commandes clients', 'Accès en lecture aux commandes clients', 'read', 'customer_orders', true, NOW(), NOW()),
(27, 'customer_orders', 'customer_orders_create', 'Créer commandes clients', 'Création de nouvelles commandes clients', 'create', 'customer_orders', true, NOW(), NOW()),
(28, 'customer_orders', 'customer_orders_update', 'Modifier commandes clients', 'Modification des commandes clients existantes', 'update', 'customer_orders', true, NOW(), NOW()),
(29, 'customer_orders', 'customer_orders_delete', 'Supprimer commandes clients', 'Suppression de commandes clients', 'delete', 'customer_orders', true, NOW(), NOW()),
(30, 'customer_orders', 'customer_orders_print', 'Imprimer étiquettes', 'Impression d''étiquettes de commandes clients', 'print', 'customer_orders', true, NOW(), NOW()),
(31, 'customer_orders', 'customer_orders_notify', 'Notifier clients', 'Envoi de notifications aux clients', 'notify', 'customer_orders', true, NOW(), NOW()),
(32, 'users', 'users_read', 'Voir utilisateurs', 'Accès en lecture aux utilisateurs', 'read', 'users', true, NOW(), NOW()),
(33, 'users', 'users_create', 'Créer utilisateurs', 'Création de nouveaux utilisateurs', 'create', 'users', true, NOW(), NOW()),
(34, 'users', 'users_update', 'Modifier utilisateurs', 'Modification des utilisateurs existants', 'update', 'users', true, NOW(), NOW()),
(35, 'users', 'users_delete', 'Supprimer utilisateurs', 'Suppression d''utilisateurs', 'delete', 'users', true, NOW(), NOW()),
(36, 'roles', 'roles_read', 'Voir rôles', 'Accès en lecture aux rôles', 'read', 'roles', true, NOW(), NOW()),
(37, 'roles', 'roles_create', 'Créer rôles', 'Création de nouveaux rôles', 'create', 'roles', true, NOW(), NOW()),
(38, 'roles', 'roles_update', 'Modifier rôles', 'Modification des rôles existants', 'update', 'roles', true, NOW(), NOW()),
(39, 'roles', 'roles_delete', 'Supprimer rôles', 'Suppression de rôles', 'delete', 'roles', true, NOW(), NOW()),
(40, 'roles', 'roles_assign', 'Assigner rôles', 'Attribution de rôles aux utilisateurs', 'assign', 'roles', true, NOW(), NOW()),
(41, 'system', 'system_admin', 'Administration système', 'Accès complet à l''administration du système', 'admin', 'system', true, NOW(), NOW()),
(42, 'system', 'nocodb_config', 'Configuration NocoDB', 'Gestion de la configuration NocoDB', 'config', 'nocodb', true, NOW(), NOW());

-- 4. Assigner toutes les permissions à l'admin
INSERT INTO role_permissions (role_id, permission_id, created_at) 
SELECT 1, id, NOW() FROM permissions;

-- 5. Assigner les permissions manager
INSERT INTO role_permissions (role_id, permission_id, created_at) 
SELECT 2, id, NOW() FROM permissions WHERE category IN ('dashboard', 'groups', 'suppliers', 'orders', 'deliveries', 'calendar', 'reconciliation', 'publicities', 'customer_orders');

-- 6. Assigner les permissions employee
INSERT INTO role_permissions (role_id, permission_id, created_at) 
SELECT 3, id, NOW() FROM permissions WHERE action = 'read' OR category = 'customer_orders';

-- 7. Assigner les permissions directeur (comme admin)
INSERT INTO role_permissions (role_id, permission_id, created_at) 
SELECT 4, id, NOW() FROM permissions;

-- 8. Réassigner les rôles utilisateurs
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES
('admin_local', 1, 'system', NOW()),
('ff0579_1752149511112', 4, 'admin_local', NOW());

-- 9. Réinitialiser les séquences
SELECT setval('roles_id_seq', 4, true);
SELECT setval('permissions_id_seq', 42, true);

-- 10. Vérifier les résultats
SELECT 'RÔLES FINAUX:' as status;
SELECT id, name, display_name, color, is_system, is_active FROM roles ORDER BY id;

SELECT 'PERMISSIONS FINALES:' as status;
SELECT COUNT(*) as total_permissions FROM permissions;

SELECT 'ASSIGNATIONS RÔLES:' as status;
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;