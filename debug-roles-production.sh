#!/bin/bash

echo "=== DIAGNOSTIC PRODUCTION - MODULE RÔLES ==="
echo "Date: $(date)"
echo ""

# Fonction pour tester une API avec authentification
test_api() {
    local endpoint=$1
    local description=$2
    
    echo "🔍 Test $description..."
    
    # Obtenir un cookie de session via login
    login_response=$(curl -s -c cookies.txt -b cookies.txt -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin"}' \
        http://localhost:3000/api/login)
    
    if echo "$login_response" | grep -q "success\|redirect\|user"; then
        echo "✅ Authentification réussie"
        
        # Tester l'API avec les cookies
        api_response=$(curl -s -b cookies.txt http://localhost:3000$endpoint)
        echo "📋 Réponse de $endpoint:"
        echo "$api_response" | jq . 2>/dev/null || echo "$api_response"
        echo ""
    else
        echo "❌ Erreur d'authentification"
        echo "Réponse: $login_response"
        echo ""
    fi
    
    # Nettoyer les cookies
    rm -f cookies.txt
}

echo "🏥 VÉRIFICATION DE L'ÉTAT DE L'APPLICATION..."

# Vérifier que l'application répond
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application accessible sur http://localhost:3000"
else
    echo "❌ Application non accessible"
    exit 1
fi

echo ""
echo "🔐 TEST DES APIs D'AUTHENTIFICATION..."

# Test de l'API de login
login_test=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}' \
    http://localhost:3000/api/login)

echo "📋 Réponse login:"
echo "$login_test"
echo ""

echo "🎭 TEST DES APIs DE GESTION DES RÔLES..."

# Tester les APIs des rôles
test_api "/api/roles" "API Rôles"
test_api "/api/permissions" "API Permissions"

echo "🗃️ VÉRIFICATION DE LA BASE DE DONNÉES..."

# Créer un script SQL temporaire pour les vérifications
cat > /tmp/check_roles_db.sql << 'EOF'
-- Vérifier l'existence des tables
\dt roles;
\dt permissions;
\dt role_permissions;
\dt user_roles;

-- Compter les données
SELECT 'roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'permissions' as table_name, COUNT(*) as count FROM permissions
UNION ALL
SELECT 'role_permissions' as table_name, COUNT(*) as count FROM role_permissions
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as count FROM user_roles;

-- Afficher quelques exemples de données
SELECT 'ROLES SAMPLE:' as info;
SELECT id, name, display_name, is_system FROM roles LIMIT 5;

SELECT 'PERMISSIONS SAMPLE:' as info;
SELECT id, name, display_name, category FROM permissions LIMIT 10;
EOF

echo "📊 Vérification des tables et données..."

# Exécuter les vérifications de base de données
if command -v psql > /dev/null 2>&1; then
    echo "📋 Résultats de la base de données:"
    PGPASSWORD="LogiFlow2025!" psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db -f /tmp/check_roles_db.sql 2>/dev/null || {
        echo "❌ Connexion à la base de données échouée"
        echo "💡 Vérifiez que PostgreSQL fonctionne sur le port 5434"
    }
else
    echo "⚠️ psql non disponible pour vérifier la base de données"
fi

rm -f /tmp/check_roles_db.sql

echo ""
echo "📁 VÉRIFICATION DES FICHIERS DE PRODUCTION..."

# Vérifier les fichiers critiques
critical_files=(
    "server/storage.production.ts"
    "server/routes.production.ts"
    "server/initRolesAndPermissions.ts"
    "init.sql"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
        
        # Vérifications spécifiques
        case $file in
            "server/storage.production.ts")
                if grep -q "async getRoles" "$file"; then
                    echo "  ✅ Méthode getRoles() présente"
                else
                    echo "  ❌ Méthode getRoles() manquante"
                fi
                
                if grep -q "async getPermissions" "$file"; then
                    echo "  ✅ Méthode getPermissions() présente"
                else
                    echo "  ❌ Méthode getPermissions() manquante"
                fi
                ;;
                
            "server/routes.production.ts")
                if grep -q "/api/roles" "$file"; then
                    echo "  ✅ Routes /api/roles présentes"
                else
                    echo "  ❌ Routes /api/roles manquantes"
                fi
                ;;
                
            "init.sql")
                if grep -q "CREATE TABLE.*roles" "$file"; then
                    echo "  ✅ Table roles dans init.sql"
                else
                    echo "  ❌ Table roles manquante dans init.sql"
                fi
                ;;
        esac
    else
        echo "❌ $file manquant"
    fi
done

echo ""
echo "🐳 VÉRIFICATION DU CONTENEUR DOCKER..."

if docker ps | grep -q logiflow; then
    echo "✅ Conteneur LogiFlow en cours d'exécution"
    
    # Vérifier les logs récents
    echo "📋 Logs récents du conteneur:"
    docker logs --tail=20 $(docker ps -q --filter name=logiflow) 2>/dev/null || echo "❌ Impossible de récupérer les logs"
else
    echo "❌ Conteneur LogiFlow non trouvé"
fi

echo ""
echo "🎯 RÉSUMÉ DU DIAGNOSTIC..."

# Déterminer les problèmes probables
echo "🔍 ANALYSE DES PROBLÈMES POTENTIELS:"
echo ""

echo "1. APIs retournent 'Aucun rôle trouvé' = Tables vides ou méthodes défaillantes"
echo "2. Erreur 401 = Problème d'authentification ou routes manquantes"
echo "3. Erreur 500 = Méthodes storage cassées ou base de données inaccessible"
echo ""

echo "💡 SOLUTIONS RECOMMANDÉES:"
echo ""
echo "Si les tables sont vides:"
echo "  → Exécuter: docker exec -it \$(docker ps -q --filter name=logiflow) node -e \"require('./dist/server/initRolesAndPermissions.js').initRolesAndPermissions()\""
echo ""
echo "Si les méthodes sont manquantes:"
echo "  → Reconstruire le conteneur: docker-compose up -d --build"
echo ""
echo "Si l'authentification échoue:"
echo "  → Vérifier les cookies et sessions dans les logs"
echo ""

echo "=== FIN DU DIAGNOSTIC ==="