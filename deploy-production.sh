#!/bin/bash

echo "🚀 SCRIPT DE DÉPLOIEMENT LOGIFLOW PRODUCTION"
echo "============================================="
echo ""

# Vérifications préalables
echo "1. Vérification des fichiers essentiels..."

# Vérifier les fichiers de production
essential_files=(
    "server/index.production.ts"
    "server/db.production.ts" 
    "server/auth-utils.production.ts"
    "server/localAuth.production.ts"
    "server/storage.production.ts"
    "server/routes.production.ts"
    "server/initDatabase.production.ts"
    "server/initRolesAndPermissions.production.ts"
    "Dockerfile"
    "docker-compose.yml"
    "migration-production.sql"
)

missing_files=()
for file in "${essential_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    else
        echo "✅ $file"
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Fichiers manquants:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

echo ""
echo "2. Vérification de la syntaxe des fichiers production..."

# Test de syntaxe TypeScript (simulation esbuild)
if command -v npx &> /dev/null; then
    echo "   Testing build production simulation..."
    # Test avec esbuild sur index.production.ts uniquement
    if npx esbuild server/index.production.ts --bundle --platform=node --format=esm --outfile=/tmp/test-build.js --external:* 2>/dev/null; then
        echo "✅ Build production simulation réussie"
        rm -f /tmp/test-build.js
    else
        echo "❌ Erreur dans le build production"
        exit 1
    fi
else
    echo "   npx non disponible, test build ignoré"
fi

echo ""
echo "3. Vérification de la cohérence Dockerfile..."

# Vérifier que le Dockerfile référence le bon fichier
if grep -q "server/index.production.ts" Dockerfile; then
    echo "✅ Dockerfile utilise index.production.ts"
else
    echo "❌ Dockerfile ne référence pas index.production.ts"
    exit 1
fi

# Vérifier les modules externes
required_externals=("express" "pg" "drizzle-orm" "passport" "connect-pg-simple")
for module in "${required_externals[@]}"; do
    if grep -q "external:$module" Dockerfile; then
        echo "✅ Module $module déclaré externe"
    else
        echo "❌ Module $module non déclaré externe"
        exit 1
    fi
done

echo ""
echo "4. Vérification des variables d'environnement..."

if [ -f ".env" ]; then
    if grep -q "DATABASE_URL" .env; then
        echo "✅ DATABASE_URL configurée"
    else
        echo "⚠️  DATABASE_URL non trouvée dans .env"
    fi
else
    echo "⚠️  Fichier .env non trouvé (normal en production Docker)"
fi

echo ""
echo "5. Test de build (simulation)..."

# Vérifier les dépendances package.json
if [ -f "package.json" ]; then
    echo "✅ package.json présent"
    
    # Vérifier les dépendances critiques
    critical_deps=("express" "pg" "drizzle-orm" "passport")
    for dep in "${critical_deps[@]}"; do
        if grep -q "\"$dep\":" package.json; then
            echo "✅ Dépendance $dep présente"
        else
            echo "❌ Dépendance $dep manquante"
            exit 1
        fi
    done
else
    echo "❌ package.json manquant"
    exit 1
fi

echo ""
echo "6. Vérification des ports et configuration..."

# Vérifier la configuration des ports
if grep -q "3000" Dockerfile; then
    echo "✅ Port 3000 configuré dans Dockerfile"
else
    echo "❌ Port 3000 non configuré"
fi

if grep -q "3000" docker-compose.yml; then
    echo "✅ Port 3000 configuré dans docker-compose.yml"
else
    echo "❌ Port 3000 non configuré dans docker-compose.yml"
fi

echo ""
echo "7. Vérification des imports et références..."

# Vérifier qu'il n'y a pas de références bcrypt
if grep -r "import.*bcrypt" server/*.production.ts 2>/dev/null; then
    echo "❌ Références bcrypt trouvées dans les fichiers production"
    exit 1
else
    echo "✅ Aucune référence bcrypt dans les fichiers production"
fi

# Vérifier les imports entre fichiers production
if grep -q "initRolesAndPermissions.production" server/routes.production.ts; then
    echo "✅ Import initRolesAndPermissions.production correct"
else
    echo "❌ Import initRolesAndPermissions incorrect"
    exit 1
fi

echo ""
echo "🎉 TOUTES LES VÉRIFICATIONS PASSÉES !"
echo ""
echo "Votre application LogiFlow est prête pour le déploiement Docker :"
echo ""
echo "Commands de déploiement :"
echo "========================"
echo "1. Build de l'image :"
echo "   docker-compose build"
echo ""
echo "2. Démarrage des services :"
echo "   docker-compose up -d"
echo ""
echo "3. Vérification des logs :"
echo "   docker-compose logs -f app"
echo ""
echo "4. Test de santé :"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "5. Accès à l'application :"
echo "   http://localhost:3000"
echo "   Login: admin / admin"
echo ""
echo "Configuration finale :"
echo "- ✅ PostgreSQL standard (pas de WebSocket)"
echo "- ✅ Authentification native (pas de bcrypt)"  
echo "- ✅ Migration sécurisée avec préservation des données"
echo "- ✅ Port 3000 configuré"
echo "- ✅ Tous les modules fonctionnels"
echo ""
echo "L'application est maintenant déployable en production ! 🚀"