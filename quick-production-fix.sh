#!/bin/bash

echo "⚡ CORRECTIF RAPIDE RÔLES PRODUCTION"
echo "=================================="

# Test de connectivité
echo "🔍 Test de connectivité Docker..."
if ! docker ps | grep -q logiflow-db; then
    echo "❌ Container logiflow-db non trouvé"
    exit 1
fi

# Exécuter directement le correctif SQL
echo "🔧 Application du correctif SQL..."
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db << 'EOF'
-- Mettre à jour les couleurs des rôles existants
UPDATE roles SET color = '#dc2626', display_name = 'Administrateur' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb', display_name = 'Manager' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a', display_name = 'Employé' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed', display_name = 'Directeur' WHERE name = 'directeur';

-- Vérifier les résultats
SELECT id, name, display_name, color FROM roles ORDER BY id;
EOF

echo "🔄 Redémarrage application..."
docker restart logiflow-app

echo "⏳ Attente redémarrage (20 secondes)..."
sleep 20

echo "✅ Correctif appliqué ! Vérifiez maintenant votre application."
echo "🎨 Les rôles devraient maintenant avoir les bonnes couleurs."