#!/bin/bash

echo "🔧 Script de mise à jour des rôles pour la production"
echo "================================================="

# Fonction pour exécuter une requête SQL
execute_sql() {
    local query="$1"
    echo "Exécution: $query"
    docker exec -i $(docker ps -q --filter name=postgres) psql -U logiflow_admin -d logiflow_db -c "$query"
}

echo ""
echo "📋 État actuel des rôles:"
execute_sql "SELECT id, name, display_name, description, color FROM roles ORDER BY name;"

echo ""
echo "🔄 Mise à jour des rôles..."

# Mise à jour du rôle admin
execute_sql "UPDATE roles SET display_name = 'Administrateur', description = 'Accès complet à toutes les fonctionnalités du système', color = '#dc2626' WHERE name = 'admin';"

# Mise à jour du rôle manager  
execute_sql "UPDATE roles SET display_name = 'Manager', description = 'Accès à la gestion des commandes, livraisons et fournisseurs', color = '#2563eb' WHERE name = 'manager';"

# Mise à jour du rôle employee
execute_sql "UPDATE roles SET display_name = 'Employé', description = 'Accès en lecture aux données et publicités', color = '#16a34a' WHERE name = 'employee';"

# Mise à jour du rôle directeur
execute_sql "UPDATE roles SET display_name = 'Directeur', description = 'Supervision générale et gestion stratégique', color = '#7c3aed' WHERE name = 'directeur';"

echo ""
echo "✅ État final des rôles:"
execute_sql "SELECT id, name, display_name, description, color, is_system, is_active FROM roles ORDER BY name;"

echo ""
echo "🧪 Test de l'API des rôles..."
echo "Redémarrage du conteneur pour prendre en compte les changements..."
docker-compose restart logiflow

echo ""
echo "✅ Mise à jour des rôles terminée !"
echo "Les rôles de base sont maintenant correctement configurés pour la production."