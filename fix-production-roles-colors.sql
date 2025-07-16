-- Script pour corriger les couleurs des rôles en production
-- LogiFlow - Correction des couleurs des rôles

-- Vérifier l'état actuel
SELECT 'ÉTAT ACTUEL DES RÔLES:' as status;
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

-- Corriger les couleurs des rôles selon les spécifications
UPDATE roles SET color = '#dc2626' WHERE name = 'admin';          -- Rouge
UPDATE roles SET color = '#2563eb' WHERE name = 'manager';        -- Bleu  
UPDATE roles SET color = '#16a34a' WHERE name = 'employee';       -- Vert
UPDATE roles SET color = '#7c3aed' WHERE name = 'directeur';      -- Violet

-- Corriger les noms d'affichage pour une meilleure présentation
UPDATE roles SET display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET display_name = 'Directeur' WHERE name = 'directeur';

-- Vérifier les corrections
SELECT 'RÔLES APRÈS CORRECTION:' as status;
SELECT id, name, display_name, color, is_active FROM roles ORDER BY id;

-- Vérifier les assignations utilisateurs
SELECT 'ASSIGNATIONS UTILISATEURS:' as status;
SELECT 
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.display_name,
  r.color
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
ORDER BY ur.user_id;