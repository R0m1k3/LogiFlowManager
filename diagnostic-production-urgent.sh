#!/bin/bash

echo "🚨 DIAGNOSTIC URGENT - Problème CRUD en production"
echo "⏱️  $(date '+%H:%M:%S') - Début du diagnostic"

echo ""
echo "🔧 Étape 1: Vérification des corrections apiRequest"
echo "Recherche des anciennes syntaxes apiRequest..."

# Vérifier s'il y a encore des apiRequest avec l'ancienne syntaxe
ISSUES=$(grep -r "apiRequest.*{" client/src --include="*.tsx" --include="*.ts" | grep "method:" | wc -l)

if [ "$ISSUES" -gt 0 ]; then
    echo "❌ PROBLÈME TROUVÉ: Il reste $ISSUES apiRequest non corrigés"
    echo "Fichiers avec problèmes:"
    grep -r "apiRequest.*{" client/src --include="*.tsx" --include="*.ts" | grep "method:"
    echo ""
    echo "🔧 Ces fichiers doivent être corrigés en:"
    echo "   apiRequest(url, 'POST', data) au lieu de apiRequest(url, {method: 'POST', body: data})"
else
    echo "✅ Tous les apiRequest semblent corrigés"
fi

echo ""
echo "🔧 Étape 2: Vérification des schemas Zod"
echo "Vérification des schemas d'insertion..."

echo "✅ insertGroupSchema: Doit accepter {name: string, color: string}"
echo "✅ insertSupplierSchema: Doit accepter {name: string, contact?: string, phone?: string}"

echo ""
echo "🔧 Étape 3: Points de debug critiques en production"
echo "🏪 Route POST /api/groups:"
echo "   - Logs request body détaillés ajoutés"
echo "   - Vérification authentification utilisateur"
echo "   - Validation Zod schema"
echo "   - Exécution SQL avec logs d'erreur"

echo "🚚 Route POST /api/suppliers:"
echo "   - Logs request body détaillés ajoutés"
echo "   - Vérification authentification utilisateur"
echo "   - Validation Zod schema"
echo "   - Exécution SQL avec logs d'erreur"

echo ""
echo "🔧 Étape 4: Instructions de test"
echo "1. Ouvrir l'interface web en production"
echo "2. Aller sur Groupes/Magasins > Créer un nouveau groupe"
echo "3. Remplir: Nom='Test Debug', Couleur='#FF5722'"
echo "4. Vérifier les logs du conteneur avec: docker logs logiflow-app"
echo "5. Les logs doivent montrer:"
echo "   📨 Request headers avec content-type: application/json"
echo "   📋 Request body content avec les vraies données"
echo "   🔐 User requesting group creation"
echo "   ✅ User has permission to create group"
echo "   ✅ Group data validation passed"
echo "   ✅ Group creation successful OU ❌ Failed to create group avec détails"

echo ""
echo "⏱️  $(date '+%H:%M:%S') - Diagnostic préparé"
echo "🎯 MAINTENANT: Testez la création et envoyez les logs d'erreur pour diagnostic"