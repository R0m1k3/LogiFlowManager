#!/bin/bash

echo "🚀 CORRECTION RAPIDE PRODUCTION - RÔLES ET DONNÉES"
echo "=================================================="

# Correction directe des données de production
echo "🔧 Correction des rôles en production..."

# Option 1: Via docker exec (si conteneur accessible)
if docker ps | grep -q "logiflow-db"; then
    echo "📋 Conteneur base de données trouvé, correction en cours..."
    docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
    -- Corriger les rôles
    UPDATE roles SET display_name = 'Administrateur', color = '#dc2626', description = 'Accès complet à toutes les fonctionnalités du système' WHERE name = 'admin';
    UPDATE roles SET display_name = 'Manager', color = '#2563eb', description = 'Accès à la gestion des commandes, livraisons et fournisseurs' WHERE name = 'manager';
    UPDATE roles SET display_name = 'Employé', color = '#16a34a', description = 'Accès en lecture aux données et publicités' WHERE name = 'employee';
    UPDATE roles SET display_name = 'Directeur', color = '#7c3aed', description = 'Direction générale et supervision' WHERE name = 'directeur';
    
    -- Supprimer les rôles invalides
    DELETE FROM user_roles WHERE role_id NOT IN (1, 2, 3, 4);
    DELETE FROM roles WHERE id NOT IN (1, 2, 3, 4);
    
    -- Vérifier les résultats
    SELECT 'RÔLES CORRIGÉS:' as status;
    SELECT id, name, display_name, color FROM roles ORDER BY id;
    "
    
    echo "✅ Données corrigées, redémarrage de l'application..."
    docker restart logiflow-app
    
else
    echo "⚠️  Conteneur base de données non trouvé."
    echo "📋 Exécutez manuellement ces commandes SQL en production:"
    echo ""
    echo "UPDATE roles SET display_name = 'Administrateur', color = '#dc2626' WHERE name = 'admin';"
    echo "UPDATE roles SET display_name = 'Manager', color = '#2563eb' WHERE name = 'manager';"
    echo "UPDATE roles SET display_name = 'Employé', color = '#16a34a' WHERE name = 'employee';"
    echo "UPDATE roles SET display_name = 'Directeur', color = '#7c3aed' WHERE name = 'directeur';"
    echo "DELETE FROM user_roles WHERE role_id NOT IN (1, 2, 3, 4);"
    echo "DELETE FROM roles WHERE id NOT IN (1, 2, 3, 4);"
fi

echo ""
echo "🔍 Vérifiez maintenant l'application sur logiflow.ffnancy.fr:3000"
echo "✅ L'erreur 'Rôle ID 6' devrait être résolue"
echo "🎨 Les couleurs des rôles devraient s'afficher correctement"