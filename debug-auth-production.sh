#!/bin/bash

echo "🔐 Debug Authentification Production - LogiFlow"
echo "=============================================="

# Test du hash admin actuel
echo "1. Test du hash admin en base de données:"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, password, password_changed FROM users WHERE username = 'admin';"

echo ""
echo "2. Test de l'API login avec admin/admin:"
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/cookies.txt \
  -v

echo ""
echo "3. Test de l'API user avec les cookies:"
curl -X GET http://localhost:3000/api/user \
  -b /tmp/cookies.txt \
  -v

echo ""
echo "4. Génération du nouveau hash pour 'admin':"
docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log('Nouveau hash pour admin:', hashPassword('admin'));
"

echo ""
echo "5. Test santé de l'application:"
curl http://localhost:3000/api/health

echo ""
echo "6. Vérification logs récents:"
docker logs logiflow_app --tail 10