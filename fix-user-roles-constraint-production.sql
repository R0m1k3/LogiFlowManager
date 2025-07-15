-- CORRECTION DÉFINITIVE: Résolution contrainte clé étrangère user_roles
-- Problème: assigned_by='system' mais utilisateur 'system' n'existe pas

-- 1. Nettoyer les entrées problématiques existantes
DELETE FROM user_roles WHERE assigned_by = 'system';

-- 2. Réassigner le rôle admin à admin_local avec assignation correcte
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 'admin_local', r.id, 'admin_local', CURRENT_TIMESTAMP
FROM roles r 
WHERE r.name = 'admin'
AND EXISTS (SELECT 1 FROM users WHERE id = 'admin_local')
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = 'admin_local' AND ur.role_id = r.id
);

-- 3. Vérification
SELECT 
  ur.user_id,
  r.name as role_name,
  ur.assigned_by,
  ur.assigned_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'admin_local';