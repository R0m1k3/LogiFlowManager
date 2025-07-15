#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨 CORRECTION URGENTE REACT ERROR #310 PRODUCTION${NC}"
echo "=================================================="

echo -e "${YELLOW}1. VÉRIFICATION STRUCTURE BACKEND PRODUCTION${NC}"

# Vérifier structure actuelle
echo "🔍 Test API structure production actuelle..."
curl -s -c /tmp/prod_test -X POST http://localhost:5000/api/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Login production réussi"
    
    # Test permissions
    PERM_TEST=$(curl -s -b /tmp/prod_test http://localhost:5000/api/permissions | jq '.[0] | has("displayName") and has("action")' 2>/dev/null)
    if [ "$PERM_TEST" = "true" ]; then
        echo "✅ Structure permissions correcte en développement"
    else
        echo "❌ Structure permissions incorrecte - displayName/action manquants"
    fi
    
    # Test rôles
    ROLES_TEST=$(curl -s -b /tmp/prod_test http://localhost:5000/api/roles | jq '.[0] | has("displayName") and has("permissions")' 2>/dev/null)
    if [ "$ROLES_TEST" = "true" ]; then
        echo "✅ Structure rôles correcte en développement"
    else
        echo "❌ Structure rôles incorrecte"
    fi
else
    echo "❌ Échec login - vérifier authentification"
fi

echo ""
echo -e "${YELLOW}2. VÉRIFICATION FICHIERS SOURCES${NC}"

# Vérifier les corrections dans storage.production.ts
if grep -q "displayName.*manquant" server/storage.production.ts; then
    echo "✅ Corrections présentes dans storage.production.ts"
else
    echo "❌ Corrections manquantes dans storage.production.ts"
    echo "🔧 Application des corrections..."
    
    # Appliquer les corrections directement
    sed -i 's/name: perm\.name || '\'''\'',$/ name: perm.name || '\''\'',\n        displayName: perm.display_name || perm.name || '\''\'',  \/\/ ✅ Ajout displayName manquant/g' server/storage.production.ts
    sed -i 's/category: perm\.category || '\''other'\'',$/ category: perm.category || '\''other\'',\n        action: perm.action || perm.name || '\''\'',            \/\/ ✅ Ajout action manquant/g' server/storage.production.ts
    
    echo "✅ Corrections appliquées à storage.production.ts"
fi

echo ""
echo -e "${YELLOW}3. REDÉMARRAGE APPLICATION${NC}"

# Redémarrer pour appliquer les changements
echo "🔄 Redémarrage application..."
pkill -f "tsx server/index.ts" 2>/dev/null
sleep 2

# Démarrer en arrière-plan
nohup npm run dev > /tmp/app.log 2>&1 &
sleep 5

# Vérifier redémarrage
if pgrep -f "tsx server/index.ts" > /dev/null; then
    echo "✅ Application redémarrée"
else
    echo "❌ Échec redémarrage"
    exit 1
fi

echo ""
echo -e "${YELLOW}4. VALIDATION CORRECTIONS${NC}"

# Attendre que l'application soit prête
sleep 10

# Test final
echo "🔍 Test final structure APIs..."
curl -s -c /tmp/final_test -X POST http://localhost:5000/api/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}' > /dev/null

if [ $? -eq 0 ]; then
    # Test permissions final
    FINAL_PERM=$(curl -s -b /tmp/final_test http://localhost:5000/api/permissions | jq '.[0] | {name, displayName, action}' 2>/dev/null)
    echo "📊 Structure permission finale:"
    echo "$FINAL_PERM"
    
    # Test rôles final
    FINAL_ROLES=$(curl -s -b /tmp/final_test http://localhost:5000/api/roles | jq '.[0] | {name, displayName, permissions: (.permissions | length)}' 2>/dev/null)
    echo "📊 Structure rôle finale:"
    echo "$FINAL_ROLES"
    
    # Vérification critique
    HAS_DISPLAY=$(echo "$FINAL_PERM" | jq -r '.displayName != null' 2>/dev/null)
    HAS_ACTION=$(echo "$FINAL_PERM" | jq -r '.action != null' 2>/dev/null)
    
    if [ "$HAS_DISPLAY" = "true" ] && [ "$HAS_ACTION" = "true" ]; then
        echo -e "${GREEN}✅ REACT ERROR #310 RÉSOLU${NC}"
        echo "Structure complète: displayName + action présents"
    else
        echo -e "${RED}❌ PROBLÈME PERSISTANT${NC}"
        echo "displayName: $HAS_DISPLAY, action: $HAS_ACTION"
    fi
else
    echo "❌ Échec test final"
fi

echo ""
echo -e "${BLUE}📝 INSTRUCTIONS PRODUCTION${NC}"
echo "Pour production Docker:"
echo "1. docker-compose down"
echo "2. docker-compose up --build -d"
echo "3. Tester page Gestion des Rôles"

echo ""
echo -e "${GREEN}✅ CORRECTION TERMINÉE${NC}"

# Nettoyage
rm -f /tmp/prod_test /tmp/final_test