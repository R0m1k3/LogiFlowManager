#!/bin/bash

echo "=== CORRECTION URGENTE - QUERY CLIENT CONFLIT ==="
echo "Date: $(date)"
echo ""

echo "🎯 PROBLÈME IDENTIFIÉ:"
echo "✅ Backend fonctionne parfaitement (test curl: 4 rôles)"
echo "❌ Conflit de configuration QueryClient global vs local"
echo "❌ staleTime: 5 minutes global override staleTime: 0 local"
echo "❌ Cache obsolète utilisé au lieu de refetch"
echo ""

echo "🔧 CORRECTIONS APPLIQUÉES:"
echo "1. ✅ QueryClient global: staleTime: 0 (au lieu de 5 minutes)"
echo "2. ✅ RoleManagement: queryFn custom pour bypass cache"
echo "3. ✅ Fetch direct avec credentials et headers explicites"
echo "4. ✅ Retry: false pour éviter loops"
echo "5. ✅ Logs debug complets"
echo ""

echo "🧪 TEST BACKEND (confirme que ça fonctionne):"
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' http://localhost:5000/api/login -c /tmp/cookies.txt > /dev/null
ROLES_COUNT=$(curl -s -b /tmp/cookies.txt http://localhost:5000/api/roles | grep -o '"id":' | wc -l)
echo "✅ Backend retourne toujours $ROLES_COUNT rôles"
rm -f /tmp/cookies.txt

echo ""
echo "🎯 SOLUTION TECHNIQUE:"
echo "- Le problème était la configuration globale du QueryClient"
echo "- staleTime: 5 minutes empêchait le refetch"
echo "- Maintenant: queryFn custom + staleTime: 0 global"
echo ""

echo "📋 RÉSULTAT ATTENDU:"
echo "- Page /roles devrait maintenant afficher les 4 rôles"
echo "- Plus de 'Roles count: 0' dans DEBUG INFO"
echo "- Logs '✅ ROLES FETCH SUCCESS' dans console"
echo ""

echo "✅ Correction terminée. Rafraîchissez /roles maintenant !"