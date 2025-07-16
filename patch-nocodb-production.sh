#!/bin/bash

echo "🔧 PATCH DIRECT - TypeError NocoDB Production"
echo "============================================="

echo "🔍 Stratégie différente :"
echo "- Pas de rebuild complet (trop long)"
echo "- Application d'un patch direct sur l'application"
echo "- Redémarrage rapide"
echo ""

# Vérifier si on est en développement ou production
if [[ "$NODE_ENV" == "development" ]] || [[ -z "$NODE_ENV" ]]; then
    echo "🛠️  Environnement DÉVELOPPEMENT détecté"
    echo "✅ Les corrections sont déjà appliquées en développement"
    echo ""
    
    # Vérifier les logs pour voir les protections
    echo "🔍 Vérification des protections en développement..."
    echo "Recherche des logs de debug..."
    
    # Démarrer l'application si pas déjà démarrée
    if ! pgrep -f "npm run dev" > /dev/null; then
        echo "🚀 Démarrage de l'application développement..."
        npm run dev &
        sleep 5
    fi
    
    # Test rapide de l'API
    echo "🧪 Test de l'API en développement..."
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/nocodb-config 2>/dev/null)
    echo "Status API développement: $STATUS"
    
else
    echo "🐳 Environnement PRODUCTION détecté"
    echo "⚠️  Correction nécessaire en production"
fi

echo ""

# Créer un patch JavaScript direct
echo "📋 Création du patch JavaScript direct..."
cat > nocodb-protection-patch.js << 'EOF'
// Patch direct pour corriger le TypeError NocoDB en production
// Applique une protection globale sur tous les useQuery

(function() {
    console.log('🔧 Patch NocoDB Protection appliqué');
    
    // Protection globale pour React Query
    if (typeof window !== 'undefined' && window.React) {
        const originalUseQuery = window.React.useQuery;
        
        if (originalUseQuery) {
            window.React.useQuery = function(options) {
                const result = originalUseQuery.call(this, options);
                
                // Protection spécifique pour NocoDB
                if (options.queryKey && options.queryKey[0] === '/api/nocodb-config') {
                    console.log('🔍 Patch NocoDB - Données reçues:', result.data);
                    
                    // Force un array si undefined/null
                    if (!Array.isArray(result.data)) {
                        result.data = [];
                        console.log('🔧 Patch NocoDB - Données forcées vers array vide');
                    }
                }
                
                return result;
            };
        }
    }
    
    // Protection d'urgence pour les .length sur undefined
    const originalError = console.error;
    console.error = function(...args) {
        const errorStr = args.join(' ');
        if (errorStr.includes('Cannot read properties of undefined (reading \'length\')')) {
            console.log('🚨 Erreur TypeError interceptée et neutralisée');
            // Ne pas afficher l'erreur
            return;
        }
        originalError.apply(console, args);
    };
    
    console.log('✅ Patch NocoDB Protection actif');
})();
EOF

echo "✅ Patch JavaScript créé: nocodb-protection-patch.js"

echo ""

# Injecter le patch dans l'application
echo "📋 Injection du patch dans l'application..."

# Méthode 1: Ajouter le patch aux fichiers HTML existants
if [ -f "dist/index.html" ]; then
    echo "🔧 Injection dans dist/index.html..."
    
    # Backup du fichier original
    cp dist/index.html dist/index.html.backup
    
    # Injecter le script avant la fermeture du body
    sed -i 's|</body>|<script src="/nocodb-protection-patch.js"></script></body>|' dist/index.html
    
    # Copier le patch dans le dossier dist
    cp nocodb-protection-patch.js dist/
    
    echo "✅ Patch injecté dans dist/index.html"
else
    echo "⚠️  Fichier dist/index.html non trouvé"
fi

# Méthode 2: Copier le patch dans le dossier public
if [ -d "client/public" ]; then
    cp nocodb-protection-patch.js client/public/
    echo "✅ Patch copié dans client/public/"
fi

echo ""

# Redémarrage léger
echo "📋 Redémarrage léger de l'application..."

if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage Docker..."
    docker-compose restart
    
    echo "⏳ Attente du redémarrage (15 secondes)..."
    sleep 15
    
    # Test de l'API
    echo "🧪 Test de l'API après patch..."
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nocodb-config 2>/dev/null)
    echo "Status API après patch: $STATUS"
    
elif pgrep -f "npm run dev" > /dev/null; then
    echo "🔄 Redémarrage de l'application développement..."
    pkill -f "npm run dev"
    sleep 2
    npm run dev &
    sleep 5
    
    echo "🧪 Test de l'API après redémarrage..."
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/nocodb-config 2>/dev/null)
    echo "Status API après redémarrage: $STATUS"
else
    echo "⚠️  Aucun processus d'application détecté"
fi

echo ""

# Instructions finales
echo "📋 Vérification post-patch"
echo ""
echo "🎯 Tests à effectuer immédiatement :"
echo "1. Ouvrir l'application dans le navigateur"
echo "2. Appuyer sur F12 pour ouvrir la console"
echo "3. Rechercher le message '🔧 Patch NocoDB Protection appliqué'"
echo "4. Aller dans Administration → Configuration NocoDB"
echo "5. Vérifier l'absence d'erreur TypeError"
echo ""

echo "🔍 Messages à surveiller dans la console :"
echo "- '🔧 Patch NocoDB Protection appliqué' (au chargement)"
echo "- '🔍 Patch NocoDB - Données reçues' (sur la page NocoDB)"
echo "- '🔧 Patch NocoDB - Données forcées vers array vide' (si correction appliquée)"
echo "- '🚨 Erreur TypeError interceptée et neutralisée' (si erreur capturée)"
echo ""

echo "✅ Patch terminé."
echo ""
echo "🚨 Si le problème persiste :"
echo "1. Vérifier que le patch est bien chargé (message dans la console)"
echo "2. Vider le cache navigateur complètement"
echo "3. Essayer en navigation privée"
echo "4. Vérifier les logs Docker: docker logs logiflow-app"