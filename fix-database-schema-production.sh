#!/bin/bash
# Script à exécuter sur le SERVEUR DE PRODUCTION

echo "🔧 Correction Schéma Base de Données - LogiFlow Production"
echo "========================================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Vérification colonnes existantes...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"

echo -e "${YELLOW}2. Ajout colonnes manquantes...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
DO \$\$
BEGIN
    -- Ajouter first_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
        RAISE NOTICE 'Colonne first_name ajoutée';
    END IF;
    
    -- Ajouter last_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
        RAISE NOTICE 'Colonne last_name ajoutée';
    END IF;
    
    -- Ajouter profile_image_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
        RAISE NOTICE 'Colonne profile_image_url ajoutée';
    END IF;
END \$\$;
"

echo -e "${YELLOW}3. Migration des données existantes...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
UPDATE users 
SET 
    first_name = CASE 
        WHEN name IS NOT NULL AND name != '' THEN SPLIT_PART(name, ' ', 1)
        ELSE username
    END,
    last_name = CASE 
        WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN SPLIT_PART(name, ' ', 2)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;
"

echo -e "${YELLOW}4. Vérification données migrées...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT id, username, name, first_name, last_name, email FROM users ORDER BY username;"

echo -e "${YELLOW}5. Ajout contraintes NOT NULL...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
"

echo -e "${YELLOW}6. Vérification finale du schéma...${NC}"
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"

echo -e "${YELLOW}7. Test mise à jour utilisateur...${NC}"
sleep 2

# Test API PUT /api/users/admin_local
RESPONSE=$(curl -s -X PUT http://localhost:3000/api/users/admin_local \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{
    "username": "admin",
    "firstName": "Admin",
    "lastName": "Test",
    "email": "admin@logiflow.com",
    "role": "admin"
  }' \
  -w "%{http_code}")

HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Mise à jour utilisateur réussie${NC}"
else
    echo -e "${RED}❌ Erreur mise à jour utilisateur (Code: $HTTP_CODE)${NC}"
    echo "Réponse: ${RESPONSE%???}"
fi

echo -e "${YELLOW}8. Redémarrage application pour appliquer les changements...${NC}"
docker-compose restart logiflow_app

echo ""
echo -e "${GREEN}✅ Migration terminée.${NC}"
echo -e "${YELLOW}📋 Résumé des changements:${NC}"
echo "   - Colonnes first_name, last_name, profile_image_url ajoutées"
echo "   - Données migrées depuis le champ name"
echo "   - Contraintes NOT NULL appliquées"
echo "   - Application redémarrée"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}⚠️  En cas de problème persistant:${NC}"
    echo "   1. Vérifiez les logs: docker logs logiflow_app --tail 20"
    echo "   2. Vérifiez le schéma: docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c 'SELECT column_name FROM information_schema.columns WHERE table_name = \"users\";'"
    echo "   3. Contactez le support avec les logs"
fi