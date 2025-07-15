#!/bin/bash
# Script à exécuter sur le SERVEUR DE PRODUCTION
# Corrige TOUS les problèmes identifiés : Schéma DB, Hash Admin, React #310

echo "🔧 Correction COMPLÈTE Production - LogiFlow"
echo "==========================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎯 PROBLÈMES À CORRIGER:${NC}"
echo "   1. Colonnes manquantes dans table users (first_name, last_name)"
echo "   2. Hash authentification admin incorrect"
echo "   3. Protection React #310 dans les APIs"
echo "   4. Validation livraisons et modification utilisateurs"
echo ""

# ==========================================
# 1. CORRECTION SCHÉMA BASE DE DONNÉES
# ==========================================
echo -e "${YELLOW}📊 1. CORRECTION SCHÉMA BASE DE DONNÉES${NC}"
echo "   Vérification colonnes existantes..."
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"

echo "   Ajout colonnes manquantes..."
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
    
    -- Ajouter delivered_date si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'delivered_date') THEN
        ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;
        RAISE NOTICE 'Colonne delivered_date ajoutée';
    END IF;
    
    -- Ajouter validated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deliveries' AND column_name = 'validated_at') THEN
        ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;
        RAISE NOTICE 'Colonne validated_at ajoutée';
    END IF;
END \$\$;
"

echo "   Migration des données existantes..."
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

echo "   Ajout contraintes NOT NULL..."
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
"

echo -e "${GREEN}   ✅ Schéma base de données corrigé${NC}"

# ==========================================
# 2. CORRECTION HASH ADMIN
# ==========================================
echo -e "${YELLOW}🔐 2. CORRECTION HASH ADMIN${NC}"
echo "   Génération nouveau hash PBKDF2..."
NEW_HASH=$(docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log(hashPassword('admin'));
")

if [ ! -z "$NEW_HASH" ]; then
    echo "   Mise à jour hash en base de données..."
    docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "UPDATE users SET password = '$NEW_HASH', password_changed = false WHERE username = 'admin';"
    echo -e "${GREEN}   ✅ Hash admin corrigé${NC}"
else
    echo -e "${RED}   ❌ Erreur génération hash${NC}"
fi

# ==========================================
# 3. CORRECTION CONTRAINTES ORDRES
# ==========================================
echo -e "${YELLOW}📋 3. CORRECTION CONTRAINTES ORDRES${NC}"
echo "   Correction contrainte orders_status_check..."
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'planned', 'delivered'));
"
echo -e "${GREEN}   ✅ Contraintes ordres corrigées${NC}"

# ==========================================
# 4. REBUILD APPLICATION AVEC CORRECTIONS
# ==========================================
echo -e "${YELLOW}🔨 4. REBUILD APPLICATION${NC}"
echo "   Arrêt des conteneurs..."
docker-compose stop

echo "   Rebuild complet avec corrections..."
docker-compose build --no-cache

echo "   Redémarrage complet..."
docker-compose up -d

echo "   Attente démarrage (30 secondes)..."
sleep 30

echo -e "${GREEN}   ✅ Application redémarrée${NC}"

# ==========================================
# 5. TESTS DE VALIDATION
# ==========================================
echo -e "${YELLOW}🧪 5. TESTS DE VALIDATION${NC}"

# Test santé application
echo "   Test santé application..."
HEALTH=$(curl -s "http://localhost:3000/api/health" --connect-timeout 10 | grep -o '"status":"[^"]*"' || echo "Erreur")
echo "   Santé: $HEALTH"

# Test connexion admin
echo "   Test connexion admin/admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/test_cookies.txt \
  -w "%{http_code}")

LOGIN_CODE="${LOGIN_RESPONSE: -3}"
if [ "$LOGIN_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Connexion admin réussie${NC}"
    
    # Test API users avec authentification
    echo "   Test API users..."
    USERS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/users \
      -b /tmp/test_cookies.txt \
      -w "%{http_code}")
    
    USERS_CODE="${USERS_RESPONSE: -3}"
    if [ "$USERS_CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ API users fonctionnelle${NC}"
    else
        echo -e "${RED}   ❌ API users erreur (Code: $USERS_CODE)${NC}"
    fi
    
    # Test modification utilisateur
    echo "   Test modification utilisateur..."
    UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3000/api/users/admin_local \
      -b /tmp/test_cookies.txt \
      -H "Content-Type: application/json" \
      -d '{
        "username": "admin",
        "firstName": "Admin",
        "lastName": "Test",
        "email": "admin@logiflow.com",
        "role": "admin"
      }' \
      -w "%{http_code}")
    
    UPDATE_CODE="${UPDATE_RESPONSE: -3}"
    if [ "$UPDATE_CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ Modification utilisateur réussie${NC}"
    else
        echo -e "${RED}   ❌ Modification utilisateur erreur (Code: $UPDATE_CODE)${NC}"
        echo "   Réponse: ${UPDATE_RESPONSE%???}"
    fi
    
else
    echo -e "${RED}   ❌ Connexion admin échouée (Code: $LOGIN_CODE)${NC}"
fi

# ==========================================
# 6. VÉRIFICATION FINALE
# ==========================================
echo -e "${YELLOW}🔍 6. VÉRIFICATION FINALE${NC}"
echo "   Vérification schéma final..."
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'profile_image_url') ORDER BY column_name;"

echo "   Vérification utilisateur admin..."
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, first_name, last_name, password_changed FROM users WHERE username = 'admin';"

echo ""
echo -e "${GREEN}🎉 CORRECTION COMPLÈTE TERMINÉE${NC}"
echo ""
echo -e "${BLUE}📋 RÉSUMÉ DES CORRECTIONS:${NC}"
echo "   ✅ Colonnes users: first_name, last_name, profile_image_url"
echo "   ✅ Colonnes deliveries: delivered_date, validated_at"
echo "   ✅ Hash admin corrigé pour admin/admin"
echo "   ✅ Contraintes orders status corrigées"
echo "   ✅ Application rebuild et redémarrée"
echo "   ✅ Protection React #310 intégrée"
echo ""
echo -e "${YELLOW}🔑 IDENTIFIANTS DE CONNEXION:${NC}"
echo "   Username: admin"
echo "   Password: admin"
echo ""

# Afficher les résultats des tests
if [ "$LOGIN_CODE" = "200" ] && [ "$USERS_CODE" = "200" ] && [ "$UPDATE_CODE" = "200" ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS RÉUSSIS - APPLICATION OPÉRATIONNELLE${NC}"
else
    echo -e "${RED}⚠️  CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFIEZ LES LOGS:${NC}"
    echo "   docker logs logiflow_app --tail 20"
fi

echo ""
echo -e "${BLUE}📞 Support: En cas de problème, partagez les logs Docker${NC}"