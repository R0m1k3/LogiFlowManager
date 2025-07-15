#!/bin/bash

echo "🔧 CORRECTION DES DONNÉES DE RÔLES EN PRODUCTION"
echo "=============================================="

# Sauvegarde des données actuelles
echo "📋 Sauvegarde des données actuelles..."
docker exec -it logiflow-db pg_dump -U logiflow_admin -d logiflow_db -t roles -t user_roles > backup_roles_$(date +%Y%m%d_%H%M%S).sql

# Correction des données de rôles
echo "🔧 Correction des données de rôles..."
docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db -c "
-- Corriger les rôles avec les bonnes couleurs et noms
UPDATE roles SET 
    display_name = 'Administrateur',
    description = 'Accès complet à toutes les fonctionnalités du système',
    color = '#dc2626',
    is_system = true,
    is_active = true
WHERE name = 'admin';

UPDATE roles SET 
    display_name = 'Manager',
    description = 'Accès à la gestion des commandes, livraisons et fournisseurs',
    color = '#2563eb',
    is_system = true,
    is_active = true
WHERE name = 'manager';

UPDATE roles SET 
    display_name = 'Employé',
    description = 'Accès en lecture aux données et publicités',
    color = '#16a34a',
    is_system = true,
    is_active = true
WHERE name = 'employee';

UPDATE roles SET 
    display_name = 'Directeur',
    description = 'Direction générale et supervision',
    color = '#7c3aed',
    is_system = false,
    is_active = true
WHERE name = 'directeur';

-- Supprimer les rôles invalides s'ils existent
DELETE FROM user_roles WHERE role_id NOT IN (1, 2, 3, 4);
DELETE FROM roles WHERE id NOT IN (1, 2, 3, 4);

-- Corriger les assignations de rôles corrompues
UPDATE user_roles SET assigned_by = 'admin_local' WHERE assigned_by = 'system' AND user_id != 'admin_local';
"

# Vérification des corrections
echo "✅ Vérification des corrections..."
docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT 'RÔLES CORRIGÉS:' as status;
SELECT id, name, display_name, color, is_system, is_active FROM roles ORDER BY id;

SELECT 'ASSIGNATIONS RÔLES:' as status;
SELECT ur.user_id, ur.role_id, r.name as role_name, r.display_name, r.color 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
ORDER BY ur.user_id;
"

# Redémarrer le conteneur pour appliquer les changements
echo "🔄 Redémarrage du conteneur LogiFlow..."
docker restart logiflow-app

echo "✅ Correction terminée ! Les données de production ont été corrigées."
echo "🔍 Vérifiez l'application sur logiflow.ffnancy.fr:3000"