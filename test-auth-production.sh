#!/bin/bash

echo "🧪 TEST AUTHENTIFICATION PRODUCTION"
echo "==================================="
echo ""

echo "Test de l'authentification admin/admin sur le serveur production..."
echo ""

# Test de connexion
echo "1. Test de connexion :"
response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/auth-cookies.txt)

http_code="${response: -3}"
response_body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Connexion réussie (HTTP 200)"
    echo "✅ Authentification admin/admin fonctionnelle"
else
    echo "❌ Échec de connexion (HTTP $http_code)"
    echo "Réponse: $response_body"
fi

echo ""

# Test de récupération utilisateur
echo "2. Test de récupération utilisateur authentifié :"
user_response=$(curl -s -w "%{http_code}" -X GET http://localhost:3000/api/user \
  -b /tmp/auth-cookies.txt)

user_http_code="${user_response: -3}"
user_body="${user_response%???}"

if [ "$user_http_code" = "200" ]; then
    echo "✅ Récupération utilisateur réussie (HTTP 200)"
    echo "✅ Session maintenue correctement"
else
    echo "❌ Échec récupération utilisateur (HTTP $user_http_code)"
    echo "Réponse: $user_body"
fi

echo ""

# Test de logout
echo "3. Test de déconnexion :"
logout_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/logout \
  -b /tmp/auth-cookies.txt)

logout_http_code="${logout_response: -3}"

if [ "$logout_http_code" = "200" ]; then
    echo "✅ Déconnexion réussie (HTTP 200)"
else
    echo "❌ Échec déconnexion (HTTP $logout_http_code)"
fi

echo ""

# Nettoyage
rm -f /tmp/auth-cookies.txt

echo "RÉSUMÉ :"
echo "========"
if [ "$http_code" = "200" ] && [ "$user_http_code" = "200" ] && [ "$logout_http_code" = "200" ]; then
    echo "🎉 TOUS LES TESTS PASSÉS - Authentification production fonctionnelle !"
else
    echo "⚠️  Certains tests ont échoué - Vérifier la configuration"
fi

echo ""
echo "Pour plus de détails, consulter les logs :"
echo "docker-compose logs -f app | grep -E '(login|auth|admin)'"