#!/bin/bash

echo "=== DEBUG FRONTEND - PAGE RÔLES ==="
echo "Date: $(date)"
echo ""

echo "🔍 ANALYSE DU PROBLÈME FRONTEND..."

# Vérifier que le backend fonctionne
echo "🔧 1. VÉRIFICATION API BACKEND..."
echo "Login admin..."
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' http://localhost:5000/api/login -c /tmp/cookies.txt > /dev/null

echo "Test API /api/roles..."
ROLES_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:5000/api/roles)
ROLES_COUNT=$(echo "$ROLES_RESPONSE" | grep -o '"id":' | wc -l)
echo "✅ API /api/roles retourne $ROLES_COUNT rôles"

echo "Test API /api/permissions..."
PERMISSIONS_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:5000/api/permissions)
PERMISSIONS_COUNT=$(echo "$PERMISSIONS_RESPONSE" | grep -o '"id":' | wc -l)
echo "✅ API /api/permissions retourne $PERMISSIONS_COUNT permissions"

echo ""
echo "🔍 2. ANALYSE DU PROBLÈME REACT..."
echo "D'après les logs console, les données arrivent correctement :"
echo "- rolesData : contient les 4 rôles"
echo "- rolesLength : 4" 
echo "- rolesIsEmpty : false"
echo "- Mais l'interface affiche 'Aucun rôle trouvé'"
echo ""
echo "🔍 3. HYPOTHÈSES POSSIBLES..."
echo "A. Problème de timing React Query"
echo "B. Problème de condition d'affichage"
echo "C. Problème de rendu des composants"
echo "D. Problème de state management"
echo ""

echo "🔧 4. SOLUTION TEMPORAIRE..."
echo "Forcer le rechargement des queries React Query..."

# Créer un script pour vérifier la page
cat > /tmp/test-roles.js << 'EOF'
// Script pour tester la page roles
function testRolesPage() {
    console.log("=== TEST ROLES PAGE ===");
    
    // Vérifier si on est sur la page roles
    const currentPath = window.location.pathname;
    console.log("Current path:", currentPath);
    
    // Vérifier les données dans le localStorage
    const storedData = localStorage.getItem('roles-data');
    console.log("Stored roles data:", storedData);
    
    // Vérifier les queries React Query
    if (window.queryClient) {
        const rolesQuery = window.queryClient.getQueryData(['/api/roles']);
        console.log("React Query - roles data:", rolesQuery);
        
        const permissionsQuery = window.queryClient.getQueryData(['/api/permissions']);
        console.log("React Query - permissions data:", permissionsQuery);
    }
    
    // Vérifier les éléments DOM
    const rolesContainer = document.querySelector('[data-testid="roles-list"]');
    console.log("Roles container found:", !!rolesContainer);
    
    const noRolesMessage = document.querySelector('text-muted-foreground');
    console.log("No roles message found:", !!noRolesMessage);
}

// Exécuter le test
testRolesPage();
EOF

echo "Script de test créé : /tmp/test-roles.js"
echo ""
echo "📋 INSTRUCTIONS POUR CORRIGER LE PROBLÈME :"
echo "1. Ouvrir la page /roles dans le navigateur"
echo "2. Ouvrir la console développeur (F12)"
echo "3. Copier-coller le contenu de /tmp/test-roles.js"
echo "4. Analyser les résultats"
echo ""
echo "🔍 Si le problème persiste, essayer :"
echo "- Forcer le rechargement : Ctrl+F5"
echo "- Vider le cache navigateur"
echo "- Redémarrer l'application"
echo ""

echo "✅ Script terminé. Investigation manuelle requise."