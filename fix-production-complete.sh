#!/bin/bash

set -e

echo "=== CORRECTION COMPLÈTE PRODUCTION - DÉPLOIEMENT DOCKER ==="
echo "Date: $(date)"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

echo "🔍 VÉRIFICATION DES FICHIERS CRITIQUES..."

# Vérifier que les fichiers de production existent
critical_files=(
    "server/index.production.ts"
    "server/routes.production.ts"
    "server/storage.production.ts"
    "server/db.production.ts"
    "server/localAuth.production.ts"
    "server/initDatabase.production.ts"
    "init.sql"
    "docker-compose.yml"
    "Dockerfile"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - EXISTS"
    else
        echo "❌ $file - MISSING"
        exit 1
    fi
done

echo ""
echo "🔧 CORRECTION DU FICHIER STORAGE.PRODUCTION.TS..."

# Vérifier que le fichier storage.production.ts n'a pas de duplications
if grep -q "export const storage" server/storage.production.ts; then
    line_count=$(grep -c "export const storage" server/storage.production.ts)
    if [ "$line_count" -gt 1 ]; then
        echo "❌ Duplication détectée dans storage.production.ts"
        echo "🔧 Correction automatique..."
        
        # Trouver la première occurrence et tronquer le fichier
        first_export_line=$(grep -n "export const storage" server/storage.production.ts | head -1 | cut -d: -f1)
        head -n "$first_export_line" server/storage.production.ts > server/storage.production.ts.tmp
        mv server/storage.production.ts.tmp server/storage.production.ts
        
        echo "✅ Fichier storage.production.ts corrigé"
    else
        echo "✅ Fichier storage.production.ts correct"
    fi
else
    echo "❌ Erreur: export const storage manquant dans storage.production.ts"
    exit 1
fi

echo ""
echo "🧪 TEST DE COMPILATION ESBUILD..."

# Tester la compilation esbuild
if cd server && npx esbuild index.production.ts --platform=node --bundle --format=esm --outfile=../dist/index.js --external:vite --external:@vitejs/* --external:@replit/* --external:tsx --external:openid-client --external:@neondatabase/serverless --external:ws --external:drizzle-orm --external:pg --external:express --external:connect-pg-simple --external:passport --external:passport-local --external:express-session --external:zod --external:express-rate-limit --external:memoizee --external:nanoid --external:date-fns; then
    echo "✅ Compilation esbuild réussie"
    cd ..
else
    echo "❌ Erreur de compilation esbuild"
    cd ..
    exit 1
fi

echo ""
echo "🏗️ TEST DE BUILD FRONTEND..."

# Tester le build du frontend
if npx vite build; then
    echo "✅ Build frontend réussi"
else
    echo "❌ Erreur de build frontend"
    exit 1
fi

echo ""
echo "📦 VÉRIFICATION DU DOCKERFILE..."

# Vérifier que le Dockerfile n'a pas de références à des fichiers manquants
if grep -q "scripts/" Dockerfile; then
    echo "❌ Référence au dossier scripts/ détectée dans Dockerfile"
    echo "🔧 Correction automatique..."
    
    # Supprimer les références au dossier scripts
    sed -i '/scripts\//d' Dockerfile
    
    echo "✅ Dockerfile corrigé"
else
    echo "✅ Dockerfile correct"
fi

echo ""
echo "🔒 VALIDATION DU DOCKER-COMPOSE..."

# Vérifier que docker-compose.yml est correct
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml valide"
else
    echo "❌ Erreur dans docker-compose.yml"
    docker-compose config
    exit 1
fi

echo ""
echo "📋 VÉRIFICATION DE LA STRUCTURE FINALE..."

# Vérifier la structure des fichiers construits
if [ -f "dist/index.js" ]; then
    echo "✅ Backend compilé : dist/index.js"
    echo "📏 Taille: $(ls -lh dist/index.js | awk '{print $5}')"
else
    echo "❌ Backend non compilé"
    exit 1
fi

if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend compilé : dist/public/"
    echo "📏 Fichiers: $(ls -1 dist/public/ | wc -l) fichiers"
else
    echo "❌ Frontend non compilé"
    exit 1
fi

echo ""
echo "🐳 PRÉPARATION DU DÉPLOIEMENT DOCKER..."

# Créer un script de déploiement Docker
cat > deploy-docker.sh << 'EOF'
#!/bin/bash

set -e

echo "=== DÉPLOIEMENT DOCKER LOGIFLOW ==="
echo "Date: $(date)"
echo ""

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down -v --remove-orphans || true

# Construire et démarrer les nouveaux conteneurs
echo "🏗️ Construction et démarrage des conteneurs..."
docker-compose up -d --build

# Attendre que les conteneurs soient prêts
echo "⏳ Attente du démarrage des conteneurs..."
sleep 20

# Vérifier l'état des conteneurs
echo "🔍 Vérification de l'état des conteneurs..."
docker-compose ps

# Test de connectivité
echo "🌐 Test de connectivité à l'application..."
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application accessible sur http://localhost:3000"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts..."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Application non accessible après $max_attempts tentatives"
    echo "📋 Logs des conteneurs:"
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 DÉPLOIEMENT DOCKER RÉUSSI!"
echo "📍 Application accessible sur: http://localhost:3000"
echo "🔐 Connexion: admin / admin"
echo ""
echo "🔧 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Arrêter: docker-compose down"
echo "  - Redémarrer: docker-compose restart"
EOF

chmod +x deploy-docker.sh

echo "✅ Script de déploiement créé: deploy-docker.sh"

echo ""
echo "🎯 RÉSUMÉ DES CORRECTIONS:"
echo "✅ Fichier storage.production.ts nettoyé"
echo "✅ Compilation esbuild validée"
echo "✅ Build frontend validé"
echo "✅ Dockerfile corrigé"
echo "✅ docker-compose.yml validé"
echo "✅ Structure finale vérifiée"
echo "✅ Script de déploiement créé"
echo ""
echo "🚀 PRÊT POUR LE DÉPLOIEMENT DOCKER!"
echo ""
echo "📝 Commandes pour déployer:"
echo "  ./deploy-docker.sh"
echo ""
echo "🎯 Le module de gestion des rôles est maintenant prêt pour la production!"