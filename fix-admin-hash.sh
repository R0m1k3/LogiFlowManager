#!/bin/bash

echo "🔧 CORRECTION HASH ADMIN EN PRODUCTION"
echo "======================================"
echo ""

echo "PROBLÈME IDENTIFIÉ :"
echo "- Utilisateur admin existe avec ancien hash"
echo "- Nouveau système PBKDF2 ne reconnaît pas l'ancien format"
echo "- Login admin/admin échoue en production"
echo ""

echo "SOLUTION APPLIQUÉE :"
echo "- Modified initDatabase.production.ts pour mettre à jour le hash automatiquement"
echo "- Le hash admin sera régénéré au prochain redémarrage"
echo "- Force password_changed = false pour garder les credentials visibles"
echo ""

echo "COMMANDES DE CORRECTION :"
echo "========================"
echo ""

echo "1. Forcer la mise à jour du hash via redémarrage :"
echo "   docker-compose restart app"
echo ""

echo "2. Ou reconstruire complètement :"
echo "   docker-compose down"
echo "   docker-compose build --no-cache" 
echo "   docker-compose up -d"
echo ""

echo "3. Vérifier les logs :"
echo "   docker-compose logs -f app | grep -E '(admin|hash|password)'"
echo ""

echo "4. Tester la connexion :"
echo "   curl -X POST http://localhost:3000/api/login \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"username\":\"admin\",\"password\":\"admin\"}' \\"
echo "        -c cookies.txt -v"
echo ""

echo "RÉSULTAT ATTENDU :"
echo "=================="
echo "✅ Message: 'Admin user password updated with new hash format'"
echo "✅ Login admin/admin fonctionne"
echo "✅ Plus d'erreur 401 Unauthorized"
echo ""

echo "Si le problème persiste, vérifier :"
echo "- L'import des fonctions auth-utils.production.js"
echo "- La fonction comparePasswords dans localAuth.production.ts"
echo "- La correspondance entre hash généré et hash vérifié"
echo ""

echo "🎯 Le redémarrage devrait résoudre le problème définitivement !"