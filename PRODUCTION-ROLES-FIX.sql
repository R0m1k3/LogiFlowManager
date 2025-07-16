-- Script de correction définitive des rôles en production
-- Résout l'incohérence entre users.role et user_roles

BEGIN;

-- 1. Diagnostic initial
SELECT 'DIAGNOSTIC INITIAL' as etape;
SELECT 
  u.id, 
  u.username, 
  u.role as role_colonne,
  COALESCE(r.name, 'AUCUN') as role_table
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- 2. Corriger les couleurs des rôles
SELECT 'CORRECTION COULEURS ROLES' as etape;
UPDATE roles SET color = '#f87171' WHERE name = 'admin' AND (color IS NULL OR color != '#f87171');
UPDATE roles SET color = '#60a5fa' WHERE name = 'manager' AND (color IS NULL OR color != '#60a5fa');
UPDATE roles SET color = '#4ade80' WHERE name = 'employee' AND (color IS NULL OR color != '#4ade80');
UPDATE roles SET color = '#a78bfa' WHERE name = 'directeur' AND (color IS NULL OR color != '#a78bfa');

-- 3. Nettoyer les assignations existantes
SELECT 'NETTOYAGE ASSIGNATIONS' as etape;
DELETE FROM user_roles;

-- 4. Synchroniser user_roles avec users.role
SELECT 'SYNCHRONISATION ROLES' as etape;
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
  u.id,
  r.id,
  'admin_local',
  NOW()
FROM users u
JOIN roles r ON u.role = r.name
WHERE u.role IS NOT NULL;

-- 5. Vérification finale
SELECT 'VERIFICATION FINALE' as etape;
SELECT 
  u.id, 
  u.username, 
  u.role as role_colonne,
  r.name as role_table,
  r.color as couleur
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 6. Afficher les couleurs des rôles
SELECT 'COULEURS ROLES' as etape;
SELECT id, name, display_name, color FROM roles ORDER BY id;

COMMIT;