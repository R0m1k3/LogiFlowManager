-- Correction des couleurs des rôles en production
-- Problème: Les couleurs ne correspondent pas aux couleurs attendues

-- Corriger les couleurs des rôles selon les logs de production
UPDATE roles SET color = '#dc2626' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed' WHERE name = 'directeur';

-- Vérifier les couleurs après correction
SELECT 
    id,
    name,
    display_name,
    color,
    description
FROM roles
ORDER BY id;