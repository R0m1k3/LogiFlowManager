-- 🚨 CORRECTION URGENTE PRODUCTION - Synchronisation des rôles et couleurs
-- Exécuter ce script en production pour corriger l'affichage des rôles

-- 1. Vérifier les rôles existants
SELECT 'AVANT CORRECTION - Rôles actuels:' as action;
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

-- 2. Nettoyer et recréer les rôles avec les bonnes couleurs
DELETE FROM user_roles; -- Supprimer temporairement les assignations
DELETE FROM role_permissions; -- Supprimer temporairement les permissions
DELETE FROM roles; -- Supprimer tous les rôles

-- 3. Recréer les rôles avec les bonnes couleurs et IDs
INSERT INTO roles (id, name, display_name, description, color, is_active, created_at, updated_at) VALUES
(1, 'admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités du système', '#f87171', true, NOW(), NOW()),
(2, 'manager', 'Manager', 'Gestion des commandes et livraisons, accès aux groupes', '#60a5fa', true, NOW(), NOW()),
(3, 'employee', 'Employé', 'Accès en lecture aux données et création limitée', '#4ade80', true, NOW(), NOW()),
(4, 'directeur', 'Directeur', 'Accès directorial avec permissions étendues', '#a78bfa', true, NOW(), NOW());

-- 4. Récréer les permissions principales
INSERT INTO permissions (id, name, display_name, action, resource, description, is_system, created_at, updated_at) VALUES
(1, 'dashboard_read', 'Voir Dashboard', 'read', 'dashboard', 'Accès au tableau de bord', true, NOW(), NOW()),
(2, 'orders_read', 'Voir Commandes', 'read', 'orders', 'Consulter les commandes', true, NOW(), NOW()),
(3, 'orders_create', 'Créer Commandes', 'create', 'orders', 'Créer de nouvelles commandes', true, NOW(), NOW()),
(4, 'orders_update', 'Modifier Commandes', 'update', 'orders', 'Modifier les commandes existantes', true, NOW(), NOW()),
(5, 'orders_delete', 'Supprimer Commandes', 'delete', 'orders', 'Supprimer des commandes', true, NOW(), NOW()),
(6, 'deliveries_read', 'Voir Livraisons', 'read', 'deliveries', 'Consulter les livraisons', true, NOW(), NOW()),
(7, 'deliveries_create', 'Créer Livraisons', 'create', 'deliveries', 'Créer de nouvelles livraisons', true, NOW(), NOW()),
(8, 'deliveries_update', 'Modifier Livraisons', 'update', 'deliveries', 'Modifier les livraisons', true, NOW(), NOW()),
(9, 'deliveries_delete', 'Supprimer Livraisons', 'delete', 'deliveries', 'Supprimer des livraisons', true, NOW(), NOW()),
(10, 'deliveries_validate', 'Valider Livraisons', 'validate', 'deliveries', 'Valider les livraisons', true, NOW(), NOW()),
(11, 'users_read', 'Voir Utilisateurs', 'read', 'users', 'Consulter les utilisateurs', true, NOW(), NOW()),
(12, 'users_create', 'Créer Utilisateurs', 'create', 'users', 'Créer des utilisateurs', true, NOW(), NOW()),
(13, 'users_update', 'Modifier Utilisateurs', 'update', 'users', 'Modifier les utilisateurs', true, NOW(), NOW()),
(14, 'users_delete', 'Supprimer Utilisateurs', 'delete', 'users', 'Supprimer des utilisateurs', true, NOW(), NOW()),
(15, 'groups_read', 'Voir Groupes', 'read', 'groups', 'Consulter les groupes/magasins', true, NOW(), NOW()),
(16, 'groups_create', 'Créer Groupes', 'create', 'groups', 'Créer des groupes/magasins', true, NOW(), NOW()),
(17, 'groups_update', 'Modifier Groupes', 'update', 'groups', 'Modifier les groupes/magasins', true, NOW(), NOW()),
(18, 'groups_delete', 'Supprimer Groupes', 'delete', 'groups', 'Supprimer des groupes/magasins', true, NOW(), NOW()),
(19, 'suppliers_read', 'Voir Fournisseurs', 'read', 'suppliers', 'Consulter les fournisseurs', true, NOW(), NOW()),
(20, 'suppliers_create', 'Créer Fournisseurs', 'create', 'suppliers', 'Créer des fournisseurs', true, NOW(), NOW()),
(21, 'suppliers_update', 'Modifier Fournisseurs', 'update', 'suppliers', 'Modifier les fournisseurs', true, NOW(), NOW()),
(22, 'suppliers_delete', 'Supprimer Fournisseurs', 'delete', 'suppliers', 'Supprimer des fournisseurs', true, NOW(), NOW()),
(23, 'calendar_read', 'Voir Calendrier', 'read', 'calendar', 'Accès au calendrier', true, NOW(), NOW()),
(24, 'publicities_read', 'Voir Publicités', 'read', 'publicities', 'Consulter les publicités', true, NOW(), NOW()),
(25, 'publicities_create', 'Créer Publicités', 'create', 'publicities', 'Créer des publicités', true, NOW(), NOW()),
(26, 'publicities_update', 'Modifier Publicités', 'update', 'publicities', 'Modifier les publicités', true, NOW(), NOW()),
(27, 'publicities_delete', 'Supprimer Publicités', 'delete', 'publicities', 'Supprimer des publicités', true, NOW(), NOW()),
(28, 'customer_orders_read', 'Voir Commandes Client', 'read', 'customer_orders', 'Consulter les commandes clients', true, NOW(), NOW()),
(29, 'customer_orders_create', 'Créer Commandes Client', 'create', 'customer_orders', 'Créer des commandes clients', true, NOW(), NOW()),
(30, 'customer_orders_update', 'Modifier Commandes Client', 'update', 'customer_orders', 'Modifier les commandes clients', true, NOW(), NOW()),
(31, 'customer_orders_delete', 'Supprimer Commandes Client', 'delete', 'customer_orders', 'Supprimer des commandes clients', true, NOW(), NOW()),
(32, 'customer_orders_print', 'Imprimer Étiquettes', 'print', 'customer_orders', 'Imprimer les étiquettes', true, NOW(), NOW()),
(33, 'customer_orders_notify', 'Notifier Client', 'notify', 'customer_orders', 'Envoyer notifications clients', true, NOW(), NOW()),
(34, 'roles_read', 'Voir Rôles', 'read', 'roles', 'Consulter les rôles', true, NOW(), NOW()),
(35, 'roles_create', 'Créer Rôles', 'create', 'roles', 'Créer des rôles', true, NOW(), NOW()),
(36, 'roles_update', 'Modifier Rôles', 'update', 'roles', 'Modifier les rôles', true, NOW(), NOW()),
(37, 'roles_delete', 'Supprimer Rôles', 'delete', 'roles', 'Supprimer des rôles', true, NOW(), NOW()),
(38, 'permissions_read', 'Voir Permissions', 'read', 'permissions', 'Consulter les permissions', true, NOW(), NOW()),
(39, 'permissions_create', 'Créer Permissions', 'create', 'permissions', 'Créer des permissions', true, NOW(), NOW()),
(40, 'permissions_update', 'Modifier Permissions', 'update', 'permissions', 'Modifier les permissions', true, NOW(), NOW()),
(41, 'permissions_delete', 'Supprimer Permissions', 'delete', 'permissions', 'Supprimer des permissions', true, NOW(), NOW()),
(42, 'nocodb_config', 'Configuration NocoDB', 'manage', 'nocodb', 'Gérer les configurations NocoDB', true, NOW(), NOW());

-- 5. Assigner les permissions aux rôles
-- Admin : toutes les permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions;

-- Manager : permissions limitées
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 6), (2, 7), (2, 8), (2, 10), (2, 11), (2, 15), (2, 17), (2, 19), (2, 21), (2, 23), (2, 24), (2, 28), (2, 29), (2, 30), (2, 32), (2, 33);

-- Employé : permissions de base
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 6), (3, 7), (3, 15), (3, 19), (3, 23), (3, 24), (3, 28), (3, 29), (3, 30), (3, 32), (3, 33);

-- Directeur : permissions étendues
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), (4, 10), (4, 11), (4, 13), (4, 15), (4, 17), (4, 19), (4, 21), (4, 23), (4, 24), (4, 25), (4, 26), (4, 27), (4, 28), (4, 29), (4, 30), (4, 31), (4, 32), (4, 33);

-- 6. Reassigner les rôles aux utilisateurs existants
-- Récupérer les rôles depuis la colonne users.role et les synchroniser avec user_roles
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
  u.id, 
  CASE 
    WHEN u.role = 'admin' THEN 1
    WHEN u.role = 'manager' THEN 2  
    WHEN u.role = 'employee' THEN 3
    WHEN u.role = 'directeur' THEN 4
    ELSE 3 -- Par défaut employé
  END as role_id,
  'admin_local' as assigned_by,
  NOW() as assigned_at
FROM users u;

-- 7. Mettre à jour les séquences pour éviter les conflits d'ID
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions));

-- 8. Vérifier le résultat final
SELECT 'APRÈS CORRECTION - Rôles synchronisés:' as action;
SELECT r.id, r.name, r.display_name, r.color, COUNT(ur.user_id) as users_count 
FROM roles r 
LEFT JOIN user_roles ur ON r.id = ur.role_id 
GROUP BY r.id, r.name, r.display_name, r.color 
ORDER BY r.id;

SELECT 'UTILISATEURS ET LEURS RÔLES:' as action;
SELECT u.username, u.role as column_role, r.name as assigned_role, r.color 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

COMMIT;