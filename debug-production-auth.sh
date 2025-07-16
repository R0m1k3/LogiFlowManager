#!/bin/bash

echo "🔍 DIAGNOSTIC COMPLET - Problème attribution groupes production..."

# 1. Vérifier l'état des routes API
echo "=== 1. TEST DES ROUTES API ==="
echo "Test route GET /api/users/USER_ID/groups..."
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:3000/api/users/admin_local/groups"

echo -e "\nTest route POST /api/users/USER_ID/groups..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"groupId": 1}' \
  "http://localhost:3000/api/users/admin_local/groups"

# 2. Vérifier l'état de la base de données
echo -e "\n=== 2. ÉTAT BASE DE DONNÉES ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Utilisateurs existants
SELECT 'USERS:' as type, id, username, role FROM users ORDER BY username;

-- Groupes existants  
SELECT 'GROUPS:' as type, id, name, color FROM groups ORDER BY id;

-- Assignations actuelles
SELECT 'USER_GROUPS:' as type, ug.user_id, u.username, ug.group_id, g.name as group_name
FROM user_groups ug
LEFT JOIN users u ON ug.user_id = u.id
LEFT JOIN groups g ON ug.group_id = g.id
ORDER BY u.username;
"

# 3. Vérifier les logs de l'application
echo -e "\n=== 3. LOGS APPLICATION (dernières 20 lignes) ==="
docker logs logiflow_app --tail=20

# 4. Test d'assignation directe en base
echo -e "\n=== 4. TEST ASSIGNATION DIRECTE ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
-- Tenter une insertion directe pour test
INSERT INTO user_groups (user_id, group_id) 
VALUES ((SELECT id FROM users WHERE username = 'admin' LIMIT 1), 1)
ON CONFLICT (user_id, group_id) DO NOTHING
RETURNING *;
"

# 5. Vérifier structure table user_groups
echo -e "\n=== 5. STRUCTURE TABLE USER_GROUPS ==="
docker exec -it logiflow_app psql -U logiflow_admin -d logiflow_db -c "
\d user_groups;
SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name = 'user_groups';
"

echo -e "\n✅ Diagnostic terminé. Analysez les résultats ci-dessus pour identifier le problème."