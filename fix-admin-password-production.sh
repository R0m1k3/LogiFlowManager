#!/bin/bash

echo "🔧 Correctif Hash Admin Production - LogiFlow"
echo "============================================="

echo "1. Génération nouveau hash pour 'admin':"
NEW_HASH=$(docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log(hashPassword('admin'));
")

echo "Nouveau hash généré: $NEW_HASH"

echo ""
echo "2. Mise à jour du hash admin en base de données:"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
UPDATE users 
SET password = '$NEW_HASH', password_changed = false 
WHERE username = 'admin';
"

echo ""
echo "3. Vérification de la mise à jour:"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
SELECT username, password_changed, 
       CASE WHEN LENGTH(password) > 50 THEN 'Hash OK' ELSE 'Hash PROBLEME' END as password_status
FROM users WHERE username = 'admin';
"

echo ""
echo "4. Test de connexion avec admin/admin:"
sleep 2
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/test_cookies.txt

echo ""
echo "5. Test accès API avec cookies:"
curl -X GET http://localhost:3000/api/user \
  -b /tmp/test_cookies.txt

echo ""
echo "✅ Correction terminée. Testez la connexion avec admin/admin"