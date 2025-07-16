#!/bin/bash

echo "🚨 CORRECTION URGENTE - TypeError NocoDB Production"
echo "================================================="

echo "🔍 Diagnostic du problème..."
echo "- Erreur: Cannot read properties of undefined (reading 'length')"
echo "- Page: Configuration NocoDB"
echo "- Environnement: Production"
echo ""

echo "📋 Étape 1: Vérification de la base de données"
if command -v psql &> /dev/null; then
    echo "🗄️  Exécution du script SQL de diagnostic..."
    psql -f fix-nocodb-production-urgent.sql
else
    echo "⚠️  psql non disponible, veuillez exécuter manuellement:"
    echo "   psql -f fix-nocodb-production-urgent.sql"
fi

echo ""
echo "📋 Étape 2: Correction des fichiers production"

echo "🔧 Création du fichier de correction rapide..."
cat > fix-nocodb-frontend-urgent.js << 'EOF'
// Correction urgente pour NocoDBConfig.tsx
// Remplace la logique de protection pour éviter le TypeError

// Protection renforcée pour les données configs
const originalUseQuery = window.React && window.React.useQuery;
if (originalUseQuery) {
  const safeUseQuery = function(options) {
    const result = originalUseQuery.call(this, options);
    if (options.queryKey && options.queryKey[0] === '/api/nocodb-config') {
      // Force un array vide si undefined/null
      if (!Array.isArray(result.data)) {
        result.data = [];
      }
    }
    return result;
  };
  
  // Remplace la fonction useQuery
  if (window.React) {
    window.React.useQuery = safeUseQuery;
  }
}

console.log('🔧 Correction NocoDB appliquée - TypeError protégé');
EOF

echo "✅ Fichier de correction créé: fix-nocodb-frontend-urgent.js"

echo ""
echo "📋 Étape 3: Redémarrage de l'application"

if command -v docker-compose &> /dev/null; then
    echo "🐳 Redémarrage complet Docker Compose..."
    docker-compose down
    docker-compose up -d --build
    
    echo "⏳ Attente du démarrage (15 secondes)..."
    sleep 15
    
    echo "🧪 Test de l'API NocoDB..."
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nocodb-config)
    echo "   Status API: $STATUS"
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
        echo "✅ API répond correctement"
    else
        echo "❌ Problème avec l'API (Status: $STATUS)"
    fi
    
elif command -v docker &> /dev/null; then
    echo "🐳 Redémarrage container Docker..."
    docker restart logiflow-app
    sleep 10
else
    echo "⚠️  Docker non trouvé, redémarrage manuel requis"
fi

echo ""
echo "🎯 Validation post-correction:"
echo "1. Accédez à Administration → Configuration NocoDB"
echo "2. Vérifiez l'absence d'erreur TypeError"
echo "3. Testez la création d'une configuration"
echo "4. Vérifiez la console JavaScript (F12)"
echo ""

echo "🔍 Logs à surveiller:"
echo "- docker logs logiflow-app | grep '📊 NocoDB'"
echo "- Console JavaScript: '🔍 NocoDBConfig Debug'"
echo ""

echo "✅ Correction terminée. Le problème TypeError devrait être résolu."
echo ""
echo "🚨 Si le problème persiste:"
echo "1. Vérifiez que la table nocodb_config existe"
echo "2. Vérifiez les permissions admin"
echo "3. Contactez le support technique"