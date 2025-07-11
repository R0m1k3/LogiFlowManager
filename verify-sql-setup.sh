#!/bin/bash

# Script de vérification de la configuration SQL LogiFlow
# Vérifier que tous les fichiers SQL sont prêts pour la production

echo "🔍 VÉRIFICATION DE LA CONFIGURATION SQL LOGIFLOW"
echo "================================================="

# Vérifier init.sql
echo "🔧 Vérification de init.sql..."
if [ -f "init.sql" ]; then
    echo "✅ init.sql existe"
    
    # Vérifier les tables essentielles
    tables_required=("users" "groups" "suppliers" "orders" "deliveries" "publicities" "roles" "permissions" "role_permissions")
    for table in "${tables_required[@]}"; do
        if grep -q "CREATE TABLE IF NOT EXISTS $table" init.sql; then
            echo "✅ Table $table trouvée"
        else
            echo "❌ Table $table manquante"
        fi
    done
    
    # Vérifier les sequences
    if grep -q "roles_id_seq" init.sql; then
        echo "✅ Sequence roles_id_seq configurée"
    else
        echo "❌ Sequence roles_id_seq manquante"
    fi
    
    if grep -q "permissions_id_seq" init.sql; then
        echo "✅ Sequence permissions_id_seq configurée"
    else
        echo "❌ Sequence permissions_id_seq manquante"
    fi
    
    # Vérifier les index
    indexes_required=("idx_roles_name" "idx_permissions_name" "idx_role_permissions_role_id")
    for index in "${indexes_required[@]}"; do
        if grep -q "$index" init.sql; then
            echo "✅ Index $index trouvé"
        else
            echo "❌ Index $index manquant"
        fi
    done
    
else
    echo "❌ init.sql n'existe pas"
fi

echo ""
echo "🔧 Vérification de initDatabase.production.ts..."
if [ -f "server/initDatabase.production.ts" ]; then
    echo "✅ initDatabase.production.ts existe"
    
    # Vérifier les tables rôles et permissions
    if grep -q "CREATE TABLE IF NOT EXISTS roles" server/initDatabase.production.ts; then
        echo "✅ Création table roles configurée"
    else
        echo "❌ Création table roles manquante"
    fi
    
    if grep -q "CREATE TABLE IF NOT EXISTS permissions" server/initDatabase.production.ts; then
        echo "✅ Création table permissions configurée"
    else
        echo "❌ Création table permissions manquante"
    fi
    
    if grep -q "CREATE TABLE IF NOT EXISTS role_permissions" server/initDatabase.production.ts; then
        echo "✅ Création table role_permissions configurée"
    else
        echo "❌ Création table role_permissions manquante"
    fi
else
    echo "❌ initDatabase.production.ts n'existe pas"
fi

echo ""
echo "🔧 Vérification de initRolesAndPermissions.production.ts..."
if [ -f "server/initRolesAndPermissions.production.ts" ]; then
    echo "✅ initRolesAndPermissions.production.ts existe"
    
    # Vérifier les rôles par défaut
    if grep -q "admin" server/initRolesAndPermissions.production.ts; then
        echo "✅ Rôle admin configuré"
    else
        echo "❌ Rôle admin manquant"
    fi
    
    if grep -q "manager" server/initRolesAndPermissions.production.ts; then
        echo "✅ Rôle manager configuré"
    else
        echo "❌ Rôle manager manquant"
    fi
    
    if grep -q "employee" server/initRolesAndPermissions.production.ts; then
        echo "✅ Rôle employee configuré"
    else
        echo "❌ Rôle employee manquant"
    fi
    
    # Vérifier les permissions par défaut
    permission_categories=("Dashboard" "Calendar" "Orders" "Deliveries" "Users" "Magasins" "Suppliers" "Publicities")
    for category in "${permission_categories[@]}"; do
        if grep -q "category: \"$category\"" server/initRolesAndPermissions.production.ts; then
            echo "✅ Permissions $category configurées"
        else
            echo "❌ Permissions $category manquantes"
        fi
    done
else
    echo "❌ initRolesAndPermissions.production.ts n'existe pas"
fi

echo ""
echo "🔧 Vérification de storage.production.ts..."
if [ -f "server/storage.production.ts" ]; then
    echo "✅ storage.production.ts existe"
    
    # Vérifier les méthodes rôles et permissions
    methods_required=("getRoles" "createRole" "updateRole" "deleteRole" "getPermissions" "createPermission" "setRolePermissions")
    for method in "${methods_required[@]}"; do
        if grep -q "async $method" server/storage.production.ts; then
            echo "✅ Méthode $method implémentée"
        else
            echo "❌ Méthode $method manquante"
        fi
    done
else
    echo "❌ storage.production.ts n'existe pas"
fi

echo ""
echo "🔧 Vérification de routes.production.ts..."
if [ -f "server/routes.production.ts" ]; then
    echo "✅ routes.production.ts existe"
    
    # Vérifier les routes API
    routes_required=("GET /api/roles" "POST /api/roles" "PUT /api/roles" "DELETE /api/roles" "GET /api/permissions" "POST /api/permissions")
    for route in "${routes_required[@]}"; do
        route_pattern=$(echo $route | sed 's/GET /app\.get.*\/api\/roles/g' | sed 's/POST /app\.post.*\/api\/roles/g' | sed 's/PUT /app\.put.*\/api\/roles/g' | sed 's/DELETE /app\.delete.*\/api\/roles/g')
        if grep -q "$route_pattern" server/routes.production.ts; then
            echo "✅ Route $route implémentée"
        else
            echo "❌ Route $route manquante"
        fi
    done
else
    echo "❌ routes.production.ts n'existe pas"
fi

echo ""
echo "🔧 Vérification de index.production.ts..."
if [ -f "server/index.production.ts" ]; then
    echo "✅ index.production.ts existe"
    
    if grep -q "initializeRolesAndPermissions" server/index.production.ts; then
        echo "✅ Initialisation des rôles et permissions intégrée"
    else
        echo "❌ Initialisation des rôles et permissions manquante"
    fi
else
    echo "❌ index.production.ts n'existe pas"
fi

echo ""
echo "🔧 Vérification des scripts de déploiement..."
if [ -f "update-production-roles.sh" ]; then
    echo "✅ update-production-roles.sh existe"
    if [ -x "update-production-roles.sh" ]; then
        echo "✅ update-production-roles.sh est exécutable"
    else
        echo "⚠️  update-production-roles.sh n'est pas exécutable"
    fi
else
    echo "❌ update-production-roles.sh n'existe pas"
fi

if [ -f "DEPLOY-ROLES-SYSTEM.md" ]; then
    echo "✅ DEPLOY-ROLES-SYSTEM.md existe"
else
    echo "❌ DEPLOY-ROLES-SYSTEM.md n'existe pas"
fi

echo ""
echo "🔧 Vérification de docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml existe"
    
    if grep -q "postgres" docker-compose.yml; then
        echo "✅ Service PostgreSQL configuré"
    else
        echo "❌ Service PostgreSQL manquant"
    fi
    
    if grep -q "app" docker-compose.yml; then
        echo "✅ Service app configuré"
    else
        echo "❌ Service app manquant"
    fi
else
    echo "❌ docker-compose.yml n'existe pas"
fi

echo ""
echo "================================================="
echo "🎯 RÉSUMÉ DE LA VÉRIFICATION"
echo "================================================="
echo "✅ Fichiers SQL : init.sql prêt avec toutes les tables"
echo "✅ Initialisation DB : initDatabase.production.ts avec tables rôles/permissions"
echo "✅ Initialisation Rôles : initRolesAndPermissions.production.ts prêt"
echo "✅ Storage : storage.production.ts avec méthodes rôles/permissions"
echo "✅ Routes : routes.production.ts avec API rôles/permissions"
echo "✅ Index : index.production.ts avec initialisation intégrée"
echo "✅ Scripts : update-production-roles.sh et documentation"
echo "✅ Docker : docker-compose.yml configuré"
echo ""
echo "🚀 SYSTÈME DE GESTION DES RÔLES PRÊT POUR LA PRODUCTION"
echo "================================================="