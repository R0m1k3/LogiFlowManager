#!/bin/bash

echo "🔧 Correction des paramètres apiRequest en production"
echo "⏱️  $(date '+%H:%M:%S') - Début de la correction"

# Créer un script Node.js pour corriger les fichiers
cat > fix_apiRequest.js << 'EOF'
const fs = require('fs');
const path = require('path');

const corrections = [
  // Corrections pour les appels apiRequest malformés
  {
    pattern: /apiRequest\(([^,]+),\s*\{\s*method:\s*["']POST["'],?\s*body:\s*([^}]+)\s*\}\)/g,
    replacement: 'apiRequest($1, "POST", $2)'
  },
  {
    pattern: /apiRequest\(([^,]+),\s*\{\s*method:\s*["']PUT["'],?\s*body:\s*([^}]+)\s*\}\)/g,
    replacement: 'apiRequest($1, "PUT", $2)'
  },
  {
    pattern: /apiRequest\(([^,]+),\s*\{\s*method:\s*["']DELETE["']\s*\}\)/g,
    replacement: 'apiRequest($1, "DELETE")'
  }
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  corrections.forEach(correction => {
    const originalContent = content;
    content = content.replace(correction.pattern, correction.replacement);
    if (content !== originalContent) {
      modified = true;
      console.log(`✅ Correction appliquée dans ${filePath}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Fichiers à corriger
const filesToFix = [
  'client/src/pages/Suppliers.tsx',
  'client/src/pages/Groups.tsx',
  'client/src/pages/Users.tsx',
  'client/src/pages/CustomerOrders.tsx',
  'client/src/pages/BLReconciliation.tsx',
  'client/src/pages/Deliveries.tsx',
  'client/src/pages/NocoDBConfig.tsx',
  'client/src/components/modals/OrderDetailModal.tsx',
  'client/src/components/PublicityForm.tsx',
  'client/src/components/Sidebar.tsx'
];

let totalFixed = 0;

filesToFix.forEach(file => {
  if (fixFile(file)) {
    totalFixed++;
  }
});

console.log(`🎯 Correction terminée: ${totalFixed} fichiers modifiés`);
EOF

# Exécuter les corrections
node fix_apiRequest.js

# Nettoyer
rm fix_apiRequest.js

echo ""
echo "✅ Correction des paramètres apiRequest terminée"
echo "🔄 Redémarrage du serveur nécessaire pour appliquer les changements"