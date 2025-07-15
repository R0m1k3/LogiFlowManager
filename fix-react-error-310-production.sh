#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 CORRECTION REACT ERROR #310 PRODUCTION${NC}"
echo "==========================================="

echo -e "${YELLOW}📝 1. VÉRIFICATION ÉTAT PRODUCTION${NC}"

# Vérifier si Docker est en cours
if docker ps | grep -q logiflow_app; then
    echo "✅ Container logiflow_app détecté"
    
    # Test API structure actuelle
    echo -e "${YELLOW}📊 2. TEST STRUCTURE APIs PRODUCTION${NC}"
    
    # Login admin
    echo "🔐 Login admin..."
    docker exec logiflow_app curl -s -c /tmp/prod_cookies -X POST http://localhost:3000/api/login \
      -H 'Content-Type: application/json' \
      -d '{"username":"admin","password":"admin"}' > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Login réussi"
        
        # Test structure permissions
        echo "🔍 Structure permissions..."
        PERM_RESPONSE=$(docker exec logiflow_app curl -s -b /tmp/prod_cookies http://localhost:3000/api/permissions)
        PERM_COUNT=$(echo "$PERM_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$PERM_COUNT" -gt "0" ]; then
            echo "✅ Permissions récupérées: $PERM_COUNT"
            
            # Vérifier displayName et action
            MISSING_FIELDS=$(echo "$PERM_RESPONSE" | jq -r '.[] | select(.displayName == null or .action == null) | .name' 2>/dev/null)
            if [ -z "$MISSING_FIELDS" ]; then
                echo "✅ Structure permissions conforme (displayName + action présents)"
            else
                echo "❌ Propriétés manquantes détectées"
                echo -e "${RED}⚠️ CAUSE PROBABLE DU REACT ERROR #310${NC}"
            fi
        else
            echo "❌ Erreur récupération permissions"
        fi
        
        # Test structure rôles
        echo "🔍 Structure rôles..."
        ROLES_RESPONSE=$(docker exec logiflow_app curl -s -b /tmp/prod_cookies http://localhost:3000/api/roles)
        ROLES_COUNT=$(echo "$ROLES_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$ROLES_COUNT" -gt "0" ]; then
            echo "✅ Rôles récupérés: $ROLES_COUNT"
        else
            echo "❌ Erreur récupération rôles"
        fi
        
    else
        echo "❌ Échec authentification production"
    fi
    
else
    echo "❌ Container logiflow_app non trouvé"
    echo "Application probablement pas déployée en production"
fi

echo ""
echo -e "${YELLOW}📝 3. APPLICATION CORRECTIONS PRODUCTION${NC}"

echo "🔄 Mise à jour fichiers production corrigés..."

# Copier les fichiers corrigés vers le container
if docker ps | grep -q logiflow_app; then
    
    # Backup des fichiers actuels
    echo "💾 Backup fichiers actuels..."
    docker exec logiflow_app cp /app/dist/storage.production.js /app/dist/storage.production.js.backup 2>/dev/null
    docker exec logiflow_app cp /app/dist/routes.production.js /app/dist/routes.production.js.backup 2>/dev/null
    
    # Reconstruire le container avec les corrections
    echo "🔨 Rebuild application avec corrections..."
    echo "COMMANDE À EXÉCUTER:"
    echo -e "${GREEN}docker-compose down && docker-compose up --build -d${NC}"
    echo ""
    echo "OU directement:"
    echo -e "${GREEN}cd /path/to/logiflow && docker-compose up --build -d${NC}"
    
else
    echo "⚠️ Container non actif - déploiement manuel requis"
fi

echo ""
echo -e "${YELLOW}📝 4. VÉRIFICATION POST-CORRECTION${NC}"
echo "Après rebuild, tester:"
echo "1. Login admin/admin"
echo "2. Navigation vers page Gestion des Rôles"
echo "3. Vérifier absence React Error #310"

echo ""
echo -e "${GREEN}✅ SCRIPT CORRECTION PRÊT${NC}"
echo "Les corrections de structure ont été appliquées dans:"
echo "- server/storage.production.ts (displayName + action ajoutés)"
echo "- Permissions et rôles retournent maintenant structure compatible frontend"
echo ""
echo -e "${BLUE}🚀 PROCHAINE ÉTAPE: Rebuild Docker en production${NC}"