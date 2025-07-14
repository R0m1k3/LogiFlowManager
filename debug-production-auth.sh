#!/bin/bash

echo "🔍 DIAGNOSTIC COMPLET PROBLÈME PRODUCTION"
echo "========================================"
echo ""

echo "TESTS D'AUTHENTIFICATION ET NAVIGATION PRODUCTION"
echo ""

echo "1. Test de base - Santé de l'application..."
health_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/api/health)
health_code="${health_response##*HTTP:}"
echo "Health check: $health_code"

if [ "$health_code" != "200" ]; then
    echo "❌ Application non disponible"
    exit 1
fi

echo ""
echo "2. Test authentification admin..."
auth_response=$(curl -s -w "HTTP:%{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/debug-cookies.txt)

auth_code="${auth_response##*HTTP:}"
echo "Login response: $auth_code"

if [ "$auth_code" = "200" ]; then
    echo "✅ Authentification réussie"
    
    echo ""
    echo "3. Test récupération profil utilisateur..."
    user_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/api/user \
      -b /tmp/debug-cookies.txt)
    
    user_code="${user_response##*HTTP:}"
    echo "User profile: $user_code"
    
    if [ "$user_code" = "200" ]; then
        echo "✅ Profil utilisateur accessible"
        
        echo ""
        echo "4. Test de toutes les pages frontend..."
        
        declare -a pages=("/" "/dashboard" "/calendar" "/orders" "/deliveries" "/publicities" "/users")
        
        for page in "${pages[@]}"; do
            echo "Testing page: $page"
            page_response=$(curl -s -w "HTTP:%{http_code}" -X GET "http://localhost:3000$page" \
              -b /tmp/debug-cookies.txt)
            page_code="${page_response##*HTTP:}"
            
            if [ "$page_code" = "200" ]; then
                echo "  ✅ Page $page: OK"
            else
                echo "  ❌ Page $page: ERREUR ($page_code)"
            fi
        done
        
        echo ""
        echo "5. Test des APIs principales..."
        
        declare -A apis=(
            ["/api/orders"]="Orders"
            ["/api/deliveries"]="Deliveries" 
            ["/api/groups"]="Groups"
            ["/api/stats/monthly"]="Statistics"
            ["/api/publicities"]="Publicities"
        )
        
        for api in "${!apis[@]}"; do
            echo "Testing API: $api"
            api_response=$(curl -s -w "HTTP:%{http_code}" -X GET "http://localhost:3000$api" \
              -b /tmp/debug-cookies.txt)
            api_code="${api_response##*HTTP:}"
            
            if [ "$api_code" = "200" ] || [ "$api_code" = "304" ]; then
                echo "  ✅ API $api: OK"
            else
                echo "  ❌ API $api: ERREUR ($api_code)"
            fi
        done
        
    else
        echo "❌ Impossible de récupérer le profil utilisateur"
    fi
else
    echo "❌ Échec authentification"
fi

# Nettoyage
rm -f /tmp/debug-cookies.txt

echo ""
echo "==============================================="
echo "DIAGNOSTIC TERMINÉ"
echo ""
echo "Si toutes les APIs fonctionnent mais que les pages"
echo "apparaissent et disparaissent, le problème est dans"
echo "le frontend React en production."
echo ""
echo "Solutions :"
echo "1. Utiliser RouterProduction.tsx créé"
echo "2. Appliquer useAuthProduction.ts"
echo "3. Redémarrer l'application avec les corrections"
echo "==============================================="