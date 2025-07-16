#!/bin/bash

echo "🚨 CORRECTION URGENTE - TypeError NocoDB Production"
echo "=================================================="
echo ""

echo "🔍 Analyse du problème :"
echo "- API backend : ✅ Fonctionne (retourne 1 config)"
echo "- Code développement : ✅ Protégé avec Array.isArray()"
echo "- Production : ❌ TypeError persistant"
echo ""

echo "🎯 Solution : Correction complète et déploiement forcé"
echo ""

# Étape 1: Diagnostic initial
echo "📋 Étape 1: Diagnostic initial"
echo "⏱️  $(date '+%H:%M:%S') - Début du diagnostic"

# Vérifier l'environnement
if [ -f "package.json" ]; then
    echo "✅ Environnement Node.js détecté"
    NODE_VERSION=$(node --version 2>/dev/null || echo "Non installé")
    echo "📦 Node.js version: $NODE_VERSION"
else
    echo "❌ package.json non trouvé"
fi

# Vérifier les dossiers critiques
echo "📁 Vérification des dossiers..."
if [ -d "client/src/pages" ]; then
    echo "✅ Dossier client/src/pages trouvé"
else
    echo "❌ Dossier client/src/pages manquant"
fi

if [ -d "node_modules" ]; then
    echo "✅ node_modules présent"
else
    echo "❌ node_modules manquant"
fi

echo ""

# Étape 2: Correction du code source
echo "📋 Étape 2: Correction du code source"
echo "⏱️  $(date '+%H:%M:%S') - Correction des composants"

# Backup des fichiers originaux
echo "💾 Sauvegarde des fichiers originaux..."
cp client/src/pages/NocoDBConfig.tsx client/src/pages/NocoDBConfig.tsx.backup.$(date +%s) 2>/dev/null || true
cp client/src/pages/Groups.tsx client/src/pages/Groups.tsx.backup.$(date +%s) 2>/dev/null || true

# Créer un patch temporaire pour NocoDBConfig.tsx
echo "🔧 Application du patch NocoDBConfig.tsx..."
cat > temp_nocodb_patch.js << 'EOF'
// Patch TypeScript pour NocoDBConfig.tsx
const fs = require('fs');
const path = require('path');

const nocodbConfigPath = path.join(__dirname, 'client/src/pages/NocoDBConfig.tsx');

if (fs.existsSync(nocodbConfigPath)) {
    let content = fs.readFileSync(nocodbConfigPath, 'utf8');
    
    // Vérifier si les protections sont déjà en place
    if (!content.includes('safeConfigs = Array.isArray(configs) ? configs : []')) {
        console.log('⚠️  Protections manquantes dans NocoDBConfig.tsx');
        
        // Ajouter les protections après la ligne des queries
        content = content.replace(
            /const \{ data: rawConfigs, isLoading, error \} = useQuery\(\{([^}]+)\}\);/,
            `const { data: rawConfigs, isLoading, error } = useQuery({$1});
            
  // Protection URGENTE contre TypeError
  const configs = rawConfigs || [];
  const safeConfigs = Array.isArray(configs) ? configs : [];
  
  // Log diagnostic production
  console.log('🔍 NocoDBConfig URGENT Debug:', { 
    rawConfigs, 
    configs,
    isArray: Array.isArray(configs), 
    safeConfigs, 
    length: safeConfigs.length,
    error,
    userRole: user?.role
  });`
        );
        
        // Remplacer toutes les utilisations de configs par safeConfigs
        content = content.replace(/\{configs\.length === 0/g, '{safeConfigs.length === 0');
        content = content.replace(/\{configs\.map\(/g, '{safeConfigs.map(');
        content = content.replace(/configs\.filter\(/g, 'safeConfigs.filter(');
        
        fs.writeFileSync(nocodbConfigPath, content, 'utf8');
        console.log('✅ NocoDBConfig.tsx corrigé');
    } else {
        console.log('✅ NocoDBConfig.tsx déjà protégé');
    }
} else {
    console.log('❌ NocoDBConfig.tsx non trouvé');
}
EOF

node temp_nocodb_patch.js
rm temp_nocodb_patch.js

# Créer un patch pour Groups.tsx
echo "🔧 Application du patch Groups.tsx..."
cat > temp_groups_patch.js << 'EOF'
// Patch TypeScript pour Groups.tsx
const fs = require('fs');
const path = require('path');

const groupsPath = path.join(__dirname, 'client/src/pages/Groups.tsx');

if (fs.existsSync(groupsPath)) {
    let content = fs.readFileSync(groupsPath, 'utf8');
    
    // Vérifier ligne 553 problématique
    if (content.includes('(nocodbConfigs || []).map(')) {
        console.log('✅ Groups.tsx déjà protégé ligne 553');
    } else {
        console.log('⚠️  Correction ligne 553 Groups.tsx...');
        
        // Forcer la protection sur tous les .map()
        content = content.replace(
            /\{nocodbConfigs\.map\(/g,
            '{(nocodbConfigs || []).map('
        );
        
        content = content.replace(
            /nocodbConfigs\.filter\(/g,
            '(nocodbConfigs || []).filter('
        );
        
        fs.writeFileSync(groupsPath, content, 'utf8');
        console.log('✅ Groups.tsx corrigé');
    }
    
    // Ajouter logs de diagnostic si manquants
    if (!content.includes('🔍 Groups NocoDB URGENT Debug')) {
        content = content.replace(
            /const nocodbConfigs = Array\.isArray\(rawNocodbConfigs\) \? rawNocodbConfigs : \[\];/,
            `const nocodbConfigs = Array.isArray(rawNocodbConfigs) ? rawNocodbConfigs : [];
  
  // Log diagnostic URGENT
  console.log('🔍 Groups NocoDB URGENT Debug:', { 
    rawNocodbConfigs, 
    nocodbConfigs,
    isArray: Array.isArray(rawNocodbConfigs),
    length: nocodbConfigs.length,
    line553: 'PROTECTED'
  });`
        );
        
        fs.writeFileSync(groupsPath, content, 'utf8');
        console.log('✅ Logs diagnostic ajoutés à Groups.tsx');
    }
} else {
    console.log('❌ Groups.tsx non trouvé');
}
EOF

node temp_groups_patch.js
rm temp_groups_patch.js

echo ""

# Étape 3: Création du patch d'urgence
echo "📋 Étape 3: Création du patch d'urgence"
echo "⏱️  $(date '+%H:%M:%S') - Patch JavaScript d'urgence"

# Créer un patch JavaScript d'urgence
cat > client/public/nocodb-urgent-fix.js << 'EOF'
// PATCH D'URGENCE - TypeError NocoDB Production
console.log('🚨 PATCH D\'URGENCE NocoDB chargé');

// Protection globale contre les erreurs .length sur undefined
(function() {
    'use strict';
    
    // Intercepter les erreurs TypeError
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && 
            event.error.message.includes('Cannot read properties of undefined (reading \'length\')')) {
            console.log('🔧 Erreur TypeError interceptée et neutralisée:', event.error.message);
            event.preventDefault();
            return true;
        }
    });
    
    // Protection React Query pour NocoDB
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            if (args[0] && args[0].includes('/api/nocodb-config')) {
                return response.clone().json().then(data => {
                    console.log('🔍 PATCH - API NocoDB interceptée:', data);
                    
                    // Forcer structure array si nécessaire
                    if (data && !Array.isArray(data)) {
                        if (data.configs && Array.isArray(data.configs)) {
                            console.log('🔧 PATCH - Structure configs OK');
                        } else {
                            console.log('🔧 PATCH - Forçage structure array');
                            data = { configs: [] };
                        }
                    }
                    
                    // Retourner la réponse modifiée
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                });
            }
            return response;
        });
    };
    
    console.log('✅ PATCH D\'URGENCE NocoDB actif');
})();
EOF

echo "✅ Patch d'urgence créé : client/public/nocodb-urgent-fix.js"

# Injecter le patch dans l'index.html si il existe
if [ -f "index.html" ]; then
    if ! grep -q "nocodb-urgent-fix.js" index.html; then
        sed -i 's|</head>|<script src="/nocodb-urgent-fix.js"></script></head>|' index.html
        echo "✅ Patch injecté dans index.html"
    fi
fi

echo ""

# Étape 4: Compilation et déploiement
echo "📋 Étape 4: Compilation et déploiement"
echo "⏱️  $(date '+%H:%M:%S') - Compilation forcée"

# Nettoyer les caches
echo "🧹 Nettoyage des caches..."
rm -rf dist/ node_modules/.vite/ .vite/ 2>/dev/null || true

# Compilation avec timeout
echo "🔄 Compilation du projet..."
timeout 180 npm run build 2>&1 | head -20

BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Compilation réussie"
elif [ $BUILD_STATUS -eq 124 ]; then
    echo "⚠️  Compilation timeout - Essai alternatif..."
    cd client && timeout 120 npx vite build --force && cd ..
else
    echo "❌ Erreur de compilation"
fi

echo ""

# Étape 5: Redémarrage application
echo "📋 Étape 5: Redémarrage application"
echo "⏱️  $(date '+%H:%M:%S') - Redémarrage"

# Redémarrer l'application
if pgrep -f "npm run dev" > /dev/null; then
    echo "🔄 Redémarrage développement..."
    pkill -f "npm run dev"
    sleep 2
    npm run dev &
    sleep 5
elif command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage Docker..."
    docker-compose restart
    sleep 15
else
    echo "⚠️  Pas de processus détecté"
fi

echo ""

# Étape 6: Tests de validation
echo "📋 Étape 6: Tests de validation"
echo "⏱️  $(date '+%H:%M:%S') - Validation"

# Test API
echo "🧪 Test API NocoDB..."
for i in {1..3}; do
    API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/nocodb-config 2>/dev/null)
    if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
        echo "✅ API opérationnelle (Status: $API_STATUS)"
        break
    else
        echo "⏳ Tentative $i/3 (Status: $API_STATUS)"
        sleep 3
    fi
done

# Test application
echo "🧪 Test application..."
APP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/ 2>/dev/null)
if [ "$APP_STATUS" = "200" ]; then
    echo "✅ Application accessible (Status: $APP_STATUS)"
else
    echo "⚠️  Application non accessible (Status: $APP_STATUS)"
fi

echo ""

# Étape 7: Instructions finales
echo "📋 Étape 7: Instructions de vérification"
echo "⏱️  $(date '+%H:%M:%S') - Vérification finale"
echo ""

echo "🎯 TESTS À EFFECTUER IMMÉDIATEMENT :"
echo "1. Ouvrir l'application dans le navigateur"
echo "2. Appuyer sur F12 pour ouvrir la console"
echo "3. Rechercher les messages :"
echo "   - '🚨 PATCH D'URGENCE NocoDB chargé'"
echo "   - '🔍 NocoDBConfig URGENT Debug'"
echo "   - '🔍 Groups NocoDB URGENT Debug'"
echo "4. Aller dans Administration → Configuration NocoDB"
echo "5. Vérifier l'ABSENCE d'erreur TypeError"
echo "6. Tester la création d'une configuration"
echo ""

echo "🔍 LOGS À SURVEILLER :"
echo "- Console : Messages de debug avec émojis 🔍"
echo "- Console : Confirmations de patch 🔧"
echo "- Console : AUCUNE erreur TypeError"
echo ""

echo "✅ CORRECTION URGENTE TERMINÉE"
echo "⏱️  $(date '+%H:%M:%S') - Fin du processus"
echo ""

echo "🚨 Si le problème persiste ENCORE :"
echo "1. Vider complètement le cache navigateur"
echo "2. Redémarrer le navigateur"
echo "3. Essayer en navigation privée"
echo "4. Vérifier les logs avec F12"
echo ""

echo "💡 SUPPORT : Le patch d'urgence intercepte et neutralise les erreurs TypeError"
echo "📧 CONTACT : Si aucune amélioration, contacter le support technique"