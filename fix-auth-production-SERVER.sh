#!/bin/bash
# Script à exécuter sur le SERVEUR DE PRODUCTION

echo "🔧 Correction Authentification Admin - LogiFlow Production"
echo "========================================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Vérification état actuel...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, password_changed, CASE WHEN LENGTH(password) > 50 THEN 'Hash présent' ELSE 'Hash manquant' END as hash_status FROM users WHERE username = 'admin';"

echo -e "${YELLOW}2. Génération nouveau hash PBKDF2 pour 'admin'...${NC}"
NEW_HASH=$(docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log(hashPassword('admin'));
")

if [ -z "$NEW_HASH" ]; then
    echo -e "${RED}❌ Erreur génération hash${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nouveau hash généré: ${NEW_HASH:0:20}...${NC}"

echo -e "${YELLOW}3. Mise à jour base de données...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "UPDATE users SET password = '$NEW_HASH', password_changed = false WHERE username = 'admin';"

echo -e "${YELLOW}4. Vérification mise à jour...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, password_changed, CASE WHEN LENGTH(password) > 50 THEN 'Hash OK' ELSE 'Hash PROBLEME' END as password_status FROM users WHERE username = 'admin';"

echo -e "${YELLOW}5. Test connexion...${NC}"
sleep 2

RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -w "%{http_code}")

HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Connexion réussie avec admin/admin${NC}"
else
    echo -e "${RED}❌ Connexion échouée (Code: $HTTP_CODE)${NC}"
    echo "Réponse: ${RESPONSE%???}"
fi

echo -e "${YELLOW}6. Vérification santé application...${NC}"
HEALTH=$(curl -s http://localhost:3000/api/health | grep -o '"status":"[^"]*"' || echo "Erreur")
echo "Santé: $HEALTH"

echo ""
echo -e "${GREEN}✅ Correction terminée.${NC}"
echo -e "${YELLOW}📋 Testez maintenant la connexion avec:${NC}"
echo "   Username: admin"
echo "   Password: admin"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}⚠️  Si la connexion échoue toujours:${NC}"
    echo "   1. Vérifiez les logs: docker logs logiflow_app --tail 20"
    echo "   2. Redémarrez l'application: docker-compose restart"
    echo "   3. Contactez le support avec les logs"
fi