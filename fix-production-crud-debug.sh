#!/bin/bash

echo "🔧 Correction du CRUD en production avec debug détaillé"
echo "⏱️  $(date '+%H:%M:%S') - Début de la correction"

# 1. Vérifier les routes de production avec logs renforcés
echo "📝 Amélioration des logs de debug en production..."

# Ajouter des logs plus détaillés au middleware d'authentification
cat >> debug-middleware.js << 'EOF'
// Ajout de logs middleware pour debug production
const originalJson = res.json;
res.json = function(data) {
  console.log('📤 Response sent:', {
    status: res.statusCode,
    url: req.url,
    method: req.method,
    dataType: typeof data,
    dataPreview: JSON.stringify(data).substring(0, 200)
  });
  return originalJson.call(this, data);
};
EOF

echo ""
echo "🔍 Vérifications à effectuer:"
echo "1. Les logs doivent montrer les vraies données reçues (pas '[object Object]')"
echo "2. Status HTTP doit être 200/201 pour les créations réussies"
echo "3. Erreurs PostgreSQL doivent apparaître avec details complets"
echo "4. Authentification doit être validée"

echo ""
echo "📊 Tests à effectuer:"
echo "✅ Créer un groupe via l'interface web"
echo "✅ Créer un fournisseur via l'interface web"
echo "✅ Vérifier les logs du conteneur Docker"
echo "✅ Tester les mêmes opérations en développement"

echo ""
echo "🐛 Points de debug critiques:"
echo "- Request body parsing (express.json middleware)"
echo "- Schema validation (Zod insertGroupSchema/insertSupplierSchema)"
echo "- Database connection et pool PostgreSQL"
echo "- Contraintes de base de données (NOT NULL, UNIQUE, etc.)"

echo ""
echo "⏱️  $(date '+%H:%M:%S') - Debug setup terminé"
echo "🎯 Maintenant, testez la création d'un groupe dans l'interface production"