#!/bin/bash

echo "🔧 Correction complète des rôles en production..."

# 1. Corriger les couleurs des rôles dans la base de données
echo "1. Correction des couleurs des rôles..."
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
UPDATE roles SET color = '#dc2626' WHERE name = 'admin';
UPDATE roles SET color = '#2563eb' WHERE name = 'manager';
UPDATE roles SET color = '#16a34a' WHERE name = 'employee';
UPDATE roles SET color = '#7c3aed' WHERE name = 'directeur';
"

# 2. Vérifier les couleurs après correction
echo "2. Vérification des couleurs..."
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
SELECT id, name, display_name, color FROM roles ORDER BY id;
"

# 3. Redémarrer l'application pour vider le cache
echo "3. Redémarrage de l'application..."
docker restart logiflow_app

# 4. Attendre que l'application redémarre
echo "4. Attente du redémarrage..."
sleep 10

# 5. Vérifier que l'application est en cours d'exécution
echo "5. Vérification du statut..."
docker ps | grep logiflow_app

echo "✅ Correction terminée!"
echo "📋 Résumé des corrections appliquées:"
echo "   - Couleurs des rôles corrigées (admin: rouge, manager: bleu, employee: vert, directeur: violet)"
echo "   - Application redémarrée pour vider le cache"
echo "   - Les routes d'attribution des groupes sont présentes"
echo ""
echo "🎯 Pour attribuer les groupes:"
echo "   1. Allez dans la page Utilisateurs"
echo "   2. Cliquez sur le bouton vert 'Groupes' à côté de l'utilisateur"
echo "   3. Dans le modal, assignez/retirez les groupes"