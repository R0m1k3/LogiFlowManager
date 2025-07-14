#!/bin/bash

echo "🧪 TEST COMPLET NAVIGATION PRODUCTION"
echo "====================================="
echo ""

echo "TEST 1: Santé de l'application..."
health=$(curl -s -w "%{http_code}" http://localhost:3000/api/health -o /dev/null)
if [ "$health" = "200" ]; then
    echo "✅ Application active"
else
    echo "❌ Application non accessible ($health)"
    exit 1
fi

echo ""
echo "TEST 2: Authentification admin..."
login=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/test-cookies.txt -o /dev/null)

if [ "$login" = "200" ]; then
    echo "✅ Login réussi"
    
    echo ""
    echo "TEST 3: Pages frontend principales..."
    
    declare -a pages=(
        "/" 
        "/dashboard" 
        "/calendar" 
        "/orders" 
        "/deliveries" 
        "/publicities" 
        "/users"
        "/bl-reconciliation"
        "/customer-orders"
    )
    
    success_count=0
    total_count=${#pages[@]}
    
    for page in "${pages[@]}"; do
        printf "  Testing $page... "
        page_status=$(curl -s -w "%{http_code}" "http://localhost:3000$page" \
          -b /tmp/test-cookies.txt -o /dev/null)
        
        if [ "$page_status" = "200" ]; then
            echo "✅"
            ((success_count++))
        else
            echo "❌ ($page_status)"
        fi
    done
    
    echo ""
    echo "RÉSULTAT: $success_count/$total_count pages OK"
    
    if [ "$success_count" = "$total_count" ]; then
        echo "🎉 TOUS LES TESTS RÉUSSIS !"
        echo "L'application fonctionne correctement en production."
    else
        echo "⚠️  Certaines pages ont des problèmes."
        echo "Vérifiez les logs de l'application pour plus de détails."
    fi
    
else
    echo "❌ Échec du login ($login)"
fi

# Nettoyage
rm -f /tmp/test-cookies.txt

echo ""
echo "Test terminé."