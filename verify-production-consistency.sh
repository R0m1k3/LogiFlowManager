#!/bin/bash

echo "🔍 AUDIT COMPLET - COHÉRENCE DÉVELOPPEMENT/PRODUCTION"
echo "=================================================="
echo "Date: $(date)"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success_count=0
error_count=0

function check_item() {
    local description="$1"
    local success="$2"
    
    if [ "$success" = "true" ]; then
        echo -e "✅ ${GREEN}$description${NC}"
        ((success_count++))
    else
        echo -e "❌ ${RED}$description${NC}"
        ((error_count++))
    fi
}

echo "🗄️  VÉRIFICATION STRUCTURE BASE DE DONNÉES"
echo "----------------------------------------"

# Vérifier les tables critiques
required_tables=("users" "roles" "permissions" "role_permissions" "user_roles" "orders" "deliveries" "customer_orders" "publicities" "nocodb_config")

for table in "${required_tables[@]}"; do
    if psql $DATABASE_URL -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        check_item "Table $table existe" "true"
    else
        check_item "Table $table existe" "false"
    fi
done

echo ""
echo "🏗️  VÉRIFICATION COLONNES CRITIQUES"
echo "--------------------------------"

# Vérifier les colonnes critiques pour les rôles
required_columns_roles=("display_name" "color" "is_active" "is_system")
for column in "${required_columns_roles[@]}"; do
    if psql $DATABASE_URL -c "\d roles" 2>/dev/null | grep -q "$column"; then
        check_item "Colonne roles.$column existe" "true"
    else
        check_item "Colonne roles.$column existe" "false"
    fi
done

# Vérifier les colonnes critiques pour les permissions
required_columns_permissions=("display_name" "action" "resource" "is_system")
for column in "${required_columns_permissions[@]}"; do
    if psql $DATABASE_URL -c "\d permissions" 2>/dev/null | grep -q "$column"; then
        check_item "Colonne permissions.$column existe" "true"
    else
        check_item "Colonne permissions.$column existe" "false"
    fi
done

# Vérifier NocoDB config
if psql $DATABASE_URL -c "\d nocodb_config" 2>/dev/null | grep -q "description"; then
    check_item "Colonne nocodb_config.description existe" "true"
else
    check_item "Colonne nocodb_config.description existe" "false"
fi

echo ""
echo "📊 VÉRIFICATION DONNÉES"
echo "---------------------"

# Compter les données
role_count=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ')
permission_count=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM permissions;" 2>/dev/null | tr -d ' ')
user_count=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')

if [ "$role_count" -ge 4 ]; then
    check_item "$role_count rôles configurés (attendu: 4+)" "true"
else
    check_item "$role_count rôles configurés (attendu: 4+)" "false"
fi

if [ "$permission_count" -ge 42 ]; then
    check_item "$permission_count permissions configurées (attendu: 42+)" "true"
else
    check_item "$permission_count permissions configurées (attendu: 42+)" "false"
fi

if [ "$user_count" -ge 1 ]; then
    check_item "$user_count utilisateurs créés" "true"
else
    check_item "$user_count utilisateurs créés" "false"
fi

echo ""
echo "🌐 VÉRIFICATION ROUTES API"
echo "------------------------"

# Vérifier que le serveur répond
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    check_item "Serveur express actif sur port 5000" "true"
else
    check_item "Serveur express actif sur port 5000" "false"
fi

# Vérifier les routes critiques (avec authentification)
required_routes=("/api/roles" "/api/permissions" "/api/users" "/api/orders" "/api/deliveries" "/api/customer-orders" "/api/publicities")

for route in "${required_routes[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000$route)
    if [ "$response" = "401" ] || [ "$response" = "200" ]; then
        check_item "Route $route accessible (réponse: $response)" "true"
    else
        check_item "Route $route accessible (réponse: $response)" "false"
    fi
done

echo ""
echo "🔧 VÉRIFICATION FICHIERS CRITIQUES"
echo "--------------------------------"

# Vérifier les fichiers critiques
critical_files=("shared/schema.ts" "server/routes.production.ts" "server/storage.production.ts" "server/initDatabase.production.ts")

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        check_item "Fichier $file existe" "true"
    else
        check_item "Fichier $file existe" "false"
    fi
done

# Vérifier la syntaxe JavaScript
if node -c server/routes.production.ts 2>/dev/null; then
    check_item "Syntaxe routes.production.ts valide" "true"
else
    check_item "Syntaxe routes.production.ts valide" "false"
fi

if node -c server/storage.production.ts 2>/dev/null; then
    check_item "Syntaxe storage.production.ts valide" "true"
else
    check_item "Syntaxe storage.production.ts valide" "false"
fi

echo ""
echo "🎨 VÉRIFICATION COHÉRENCE RÔLES"
echo "-----------------------------"

# Vérifier que les rôles ont des couleurs
roles_with_colors=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM roles WHERE color IS NOT NULL AND color != '#6b7280';" 2>/dev/null | tr -d ' ')

if [ "$roles_with_colors" -ge 3 ]; then
    check_item "$roles_with_colors rôles avec couleurs personnalisées" "true"
else
    check_item "$roles_with_colors rôles avec couleurs personnalisées" "false"
fi

# Vérifier que les rôles ont des display_name
roles_with_display_names=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM roles WHERE display_name IS NOT NULL;" 2>/dev/null | tr -d ' ')

if [ "$roles_with_display_names" -eq "$role_count" ]; then
    check_item "Tous les rôles ont des display_name" "true"
else
    check_item "Tous les rôles ont des display_name" "false"
fi

echo ""
echo "📋 RÉSUMÉ DE L'AUDIT"
echo "=================="
echo -e "✅ ${GREEN}Succès: $success_count${NC}"
echo -e "❌ ${RED}Erreurs: $error_count${NC}"

if [ $error_count -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}AUDIT RÉUSSI - Système entièrement cohérent !${NC}"
    echo "✅ Base de données correctement configurée"
    echo "✅ Toutes les colonnes présentes"
    echo "✅ Routes API fonctionnelles"
    echo "✅ Fichiers de production valides"
    echo "✅ Rôles et permissions opérationnels"
else
    echo -e "\n⚠️  ${YELLOW}PROBLÈMES DÉTECTÉS - Corrections nécessaires${NC}"
    echo "📝 Voir les détails ci-dessus pour les erreurs spécifiques"
fi

echo ""
echo "💡 PROCHAINES ÉTAPES RECOMMANDÉES:"
echo "1. Redémarrer Docker en production pour appliquer les migrations"
echo "2. Tester l'interface utilisateur pour vérifier les couleurs des rôles"
echo "3. Vérifier l'assignation de rôles utilisateurs"
echo "4. Tester la création de configurations NocoDB"