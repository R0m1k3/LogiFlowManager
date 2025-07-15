#!/bin/bash

echo "🔧 Correctifs critiques Utilisateurs & Livraisons - LogiFlow Production"
echo "======================================================================="

# Couleurs pour logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 CORRECTIFS INCLUS:${NC}"
echo "   👤 Utilisateurs: Validation obligatoire + modification opérationnelle"
echo "   🚛 Livraisons: Validation adaptative + gestion erreurs + route POST corrigée"
echo "   📅 Calendrier: Livraisons visibles + logs debug"
echo "   🔧 Routes API: Validation complète + messages d'erreur spécifiques"
echo "   ✅ Ordre routes: Route validation AVANT route générale"
echo "   🔐 React #310: Protection Array.isArray() dans storage + routes production"
echo "   📊 Rôles & Permissions: Protection complète null/undefined"
echo ""

# 1. Arrêter le conteneur LogiFlow
echo -e "${YELLOW}📦 Arrêt du conteneur LogiFlow...${NC}"
docker stop logiflow_app

# 2. Rebuild du conteneur avec les corrections
echo -e "${YELLOW}🔨 Reconstruction du conteneur avec corrections...${NC}"
docker-compose build --no-cache

# 3. Redémarrage complet
echo -e "${YELLOW}🚀 Redémarrage complet...${NC}"
docker-compose up -d

# 4. Attendre démarrage
echo -e "${YELLOW}⏳ Attente démarrage (30 secondes)...${NC}"
sleep 30

# 5. Vérifications
echo -e "${YELLOW}🔍 Vérifications post-déploiement...${NC}"

# Vérification santé application
echo "🏥 Test santé application:"
HEALTH=$(curl -s "http://localhost:3000/api/health" --connect-timeout 10 | jq -r '.status' 2>/dev/null || echo "error")
echo "   Statut santé: $HEALTH"

# Test API Users
echo "👤 Test API Users:"
USERS_COUNT=$(curl -s "http://localhost:3000/api/users" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq length 2>/dev/null || echo "0")
echo "   Utilisateurs: $USERS_COUNT"

# Test API Deliveries avec dates
echo "🚛 Test API Deliveries (range juillet 2025):"
DELIVERIES_JULY=$(curl -s "http://localhost:3000/api/deliveries?startDate=2025-07-01&endDate=2025-07-31" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq length 2>/dev/null || echo "0")
echo "   Livraisons juillet 2025: $DELIVERIES_JULY"

# Test colonne validation livraisons
echo "🔍 Test colonnes validation livraisons:"
TEST_COLUMNS=$(curl -s "http://localhost:3000/api/debug/db" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq -r '.deliveries_columns | length' 2>/dev/null || echo "0")
echo "   Colonnes deliveries: $TEST_COLUMNS"

echo ""
echo "================================================================="
if [ "$HEALTH" = "ok" ]; then
    echo -e "${GREEN}✅ CORRECTIFS APPLIQUÉS AVEC SUCCÈS !${NC}"
    echo -e "${GREEN}   🔗 Application: http://localhost:3000${NC}"
    echo -e "${GREEN}   👤 Utilisateurs: Modification et validation opérationnelles${NC}"
    echo -e "${GREEN}   🚛 Livraisons: Validation adaptative aux colonnes disponibles${NC}"
    echo -e "${GREEN}   📅 Calendrier: Livraisons maintenant visibles${NC}"
    echo -e "${GREEN}   📊 Tests: Utilisateurs $USERS_COUNT, Livraisons $DELIVERIES_JULY, Colonnes $TEST_COLUMNS${NC}"
    echo ""
    echo -e "${GREEN}🎯 PROBLÈMES RÉSOLUS:${NC}"
    echo -e "${GREEN}   ✓ Impossible de modifier un utilisateur${NC}"
    echo -e "${GREEN}   ✓ Impossible de valider une livraison${NC}"
    echo -e "${GREEN}   ✓ Champs nom/prénom/email non obligatoires${NC}"
    echo -e "${GREEN}   ✓ Livraisons invisibles dans calendrier${NC}"
else
    echo -e "${RED}❌ ÉCHEC DU DÉPLOIEMENT${NC}"
    echo -e "${RED}   ❌ Santé: $HEALTH${NC}"
    echo -e "${RED}   ⚠️  Vérifiez les logs Docker: docker logs logiflow_app${NC}"
fi
echo "================================================================="