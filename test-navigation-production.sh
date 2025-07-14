#!/bin/bash

echo "🧪 TEST NAVIGATION PRODUCTION"
echo "============================="
echo ""

echo "1. Test authentification..."
response=$(curl -s -w "HTTP:%{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/nav-cookies.txt)

http_code="${response##*HTTP:}"

if [ "$http_code" = "200" ]; then
    echo "✅ Authentification réussie"
    
    echo ""
    echo "2. Test récupération utilisateur..."
    user_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/api/user \
      -b /tmp/nav-cookies.txt)
    
    user_http_code="${user_response##*HTTP:}"
    
    if [ "$user_http_code" = "200" ]; then
        echo "✅ Utilisateur récupéré"
        
        echo ""
        echo "3. Test accès aux pages frontend..."
        
        echo "Test /dashboard:"
        dashboard_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/dashboard \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $dashboard_response"
        
        echo "Test /calendar:"
        calendar_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/calendar \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $calendar_response"
        
        echo "Test /orders:"
        orders_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/orders \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $orders_response"
        
    else
        echo "❌ Problème récupération utilisateur: $user_http_code"
    fi
else
    echo "❌ Problème authentification: $http_code"
fi

rm -f /tmp/nav-cookies.txt
