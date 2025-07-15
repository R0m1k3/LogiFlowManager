-- Script de mise à jour des rôles pour la production
-- Ce script met à jour les rôles existants avec les bonnes valeurs

-- Mise à jour du rôle admin
UPDATE roles 
SET 
  display_name = 'Administrateur',
  description = 'Accès complet à toutes les fonctionnalités du système',
  color = '#dc2626'
WHERE name = 'admin';

-- Mise à jour du rôle manager
UPDATE roles 
SET 
  display_name = 'Manager',
  description = 'Accès à la gestion des commandes, livraisons et fournisseurs',
  color = '#2563eb'
WHERE name = 'manager';

-- Mise à jour du rôle employee
UPDATE roles 
SET 
  display_name = 'Employé',
  description = 'Accès en lecture aux données et publicités',
  color = '#16a34a'
WHERE name = 'employee';

-- Mise à jour du rôle directeur
UPDATE roles 
SET 
  display_name = 'Directeur',
  description = 'Supervision générale et gestion stratégique',
  color = '#7c3aed'
WHERE name = 'directeur';

-- Vérification des rôles mis à jour
SELECT id, name, display_name, description, color, is_system, is_active 
FROM roles 
ORDER BY name;