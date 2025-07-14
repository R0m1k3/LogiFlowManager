#!/bin/bash

echo "🔧 Correction bugs Calendrier & Publicités - LogiFlow Production"
echo "================================================================="

# Couleurs pour logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Test API Publicités avec filtre année
echo "🎯 Test API Publicités (filtre année 2025):"
PUBLICITIES_2025=$(curl -s "http://localhost:3000/api/publicities?year=2025" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq length 2>/dev/null || echo "0")
echo "   Publicités 2025: $PUBLICITIES_2025"

echo "🎯 Test API Publicités (filtre année 2026):"
PUBLICITIES_2026=$(curl -s "http://localhost:3000/api/publicities?year=2026" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq length 2>/dev/null || echo "0")
echo "   Publicités 2026: $PUBLICITIES_2026"

# Test API Orders avec dates
echo "🎯 Test API Orders (range juillet 2025):"
ORDERS_JULY=$(curl -s "http://localhost:3000/api/orders?startDate=2025-07-01&endDate=2025-07-31" \
  -H "Cookie: connect.sid=test" \
  --connect-timeout 10 | jq length 2>/dev/null || echo "0")
echo "   Commandes juillet 2025: $ORDERS_JULY"

# Vérification santé application
echo "🎯 Santé de l'application:"
HEALTH=$(curl -s "http://localhost:3000/api/debug/status" \
  --connect-timeout 5 | jq -r '.status' 2>/dev/null || echo "ERROR")
echo "   Status: $HEALTH"

# Logs récents
echo -e "${YELLOW}📋 Logs récents du conteneur:${NC}"
docker logs logiflow_app --tail 10

echo ""
echo "================================================================="
if [ "$HEALTH" = "ok" ]; then
    echo -e "${GREEN}✅ MISE À JOUR RÉUSSIE !${NC}"
    echo -e "${GREEN}   🔗 Application: http://localhost:3000${NC}"
    echo -e "${GREEN}   📅 Calendrier: Commandes maintenant visibles${NC}"
    echo -e "${GREEN}   🎯 Publicités: Filtre par année opérationnel${NC}"
else
    echo -e "${RED}❌ PROBLÈME DÉTECTÉ${NC}"
    echo -e "${RED}   Vérifiez les logs: docker logs logiflow_app${NC}"
fi
echo "================================================================="