#!/bin/bash

echo "🔍 DEBUG AUTHENTIFICATION PRODUCTION"
echo "===================================="
echo ""

echo "1. Test de l'endpoint /api/user sans authentification :"
curl -s -w "HTTP: %{http_code}\n" http://localhost:3000/api/user | head -3
echo ""

echo "2. Test de connexion admin/admin :"
response=$(curl -s -w "HTTP: %{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/prod-cookies.txt)

http_code="${response: -3}"
response_body="${response%???}"

echo "Code HTTP: $http_code"
echo "Réponse: $response_body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Connexion réussie ! Test de récupération utilisateur..."
    
    echo "3. Test /api/user avec session :"
    user_response=$(curl -s -w "HTTP: %{http_code}" -X GET http://localhost:3000/api/user \
      -b /tmp/prod-cookies.txt)
    
    user_http_code="${user_response: -3}"
    user_body="${user_response%???}"
    
    echo "Code HTTP: $user_http_code"
    echo "Réponse: $user_body"
    
    if [ "$user_http_code" = "200" ]; then
        echo "✅ Session maintenue ! L'utilisateur est bien récupéré."
        echo "🎯 La sidebar devrait maintenant afficher les menus."
    else
        echo "❌ Problème de session - l'utilisateur n'est pas maintenu."
    fi
else
    echo "❌ Problème de connexion - vérifier le hash du mot de passe."
fi

echo ""
echo "4. Test des logs production :"
echo "Vérifier les logs avec :"
echo "docker-compose logs -f app | grep -E '(login|user|auth|sidebar)'"

# Nettoyage
rm -f /tmp/prod-cookies.txt

echo ""
echo "RÉSUMÉ DU DIAGNOSTIC :"
echo "====================="
if [ "$http_code" = "200" ] && [ "$user_http_code" = "200" ]; then
    echo "🎉 Authentification production fonctionnelle !"
    echo "   Les menus de la sidebar devraient s'afficher."
else
    echo "⚠️  Problème d'authentification détecté."
    echo "   Les menus ne s'affichent pas car user est null."
fi