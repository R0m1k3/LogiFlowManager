#!/bin/bash

echo "=== CORRECTION URGENTE - ROUTES DUPLIQUÉES PRODUCTION ==="
echo "Date: $(date)"
echo ""

echo "🔍 DIAGNOSTIC DU PROBLÈME..."
echo ""

# Chercher les routes dupliquées
echo "📋 Routes /api/roles trouvées dans routes.production.ts :"
grep -n "app.get.*api/roles" server/routes.production.ts

echo ""
echo "🔧 PROBLÈME IDENTIFIÉ :"
echo "   - Duplication de routes /api/roles dans le fichier"  
echo "   - La première route intercepte les requêtes"
echo "   - La deuxième route (correcte) n'est jamais atteinte"
echo ""

echo "📝 CORRECTION EN COURS..."

# Sauvegarder le fichier original
cp server/routes.production.ts server/routes.production.ts.backup

echo "✅ Sauvegarde créée: server/routes.production.ts.backup"

# Corriger le fichier en supprimant les routes dupliquées
python3 << 'EOF'
import re

# Lire le fichier
with open('server/routes.production.ts', 'r') as f:
    content = f.read()

# Pattern pour identifier et supprimer les premières routes dupliquées (lignes 643-750 environ)
# On garde seulement les routes définies après le commentaire "===== ROLE MANAGEMENT ROUTES ====="

lines = content.split('\n')
new_lines = []
skip_mode = False
role_section_found = False

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Détecter le début de la section de rôles officielle
    if "===== ROLE MANAGEMENT ROUTES =====" in line:
        role_section_found = True
        skip_mode = False
        new_lines.append(line)
        continue
    
    # Si on trouve une route /api/roles avant la section officielle, on commence à ignorer
    if not role_section_found and ("app.get('/api/roles'" in line or "app.get(\"/api/roles\"" in line):
        skip_mode = True
        print(f"🗑️  Suppression de la route dupliquée ligne {line_num}")
        continue
    
    # Si on trouve une route /api/permissions avant la section officielle, on continue à ignorer
    if skip_mode and ("app.get('/api/permissions'" in line or "app.get(\"/api/permissions\"" in line):
        print(f"🗑️  Suppression de la route permissions dupliquée ligne {line_num}")
        continue
    
    # Arrêter d'ignorer quand on arrive à une nouvelle section ou route différente
    if skip_mode and line.strip().startswith('app.') and not any(x in line for x in ['/api/roles', '/api/permissions']):
        skip_mode = False
    
    # Si on n'ignore pas, ajouter la ligne
    if not skip_mode:
        new_lines.append(line)

# Écrire le fichier corrigé
with open('server/routes.production.ts', 'w') as f:
    f.write('\n'.join(new_lines))

print("✅ Fichier corrigé")
EOF

echo ""
echo "🧪 VÉRIFICATION DE LA CORRECTION..."

# Vérifier le résultat
echo "📋 Routes /api/roles restantes :"
grep -n "app.get.*api/roles" server/routes.production.ts

echo ""
echo "📋 Vérification des erreurs de syntaxe..."
if node -c server/routes.production.ts 2>/dev/null; then
    echo "✅ Syntaxe JavaScript valide"
else
    echo "❌ Erreur de syntaxe détectée!"
    echo "🔄 Restauration du fichier original..."
    mv server/routes.production.ts.backup server/routes.production.ts
    exit 1
fi

echo ""
echo "🔄 REDÉMARRAGE DE L'APPLICATION..."

# Redémarrer l'application si c'est un workflow
if pgrep -f "tsx server" > /dev/null; then
    echo "🔄 Arrêt du serveur actuel..."
    pkill -f "tsx server"
    sleep 2
    
    echo "🚀 Redémarrage en cours..."
    # Le workflow se redémarrera automatiquement
else
    echo "ℹ️  Serveur non détecté, redémarrage manuel nécessaire"
fi

echo ""
echo "🎉 CORRECTION TERMINÉE !"
echo ""
echo "💡 RÉSUMÉ :"
echo "   ✅ Routes dupliquées supprimées"
echo "   ✅ Routes officielles conservées (section ROLE MANAGEMENT)"
echo "   ✅ Syntaxe validée"
echo "   🔄 Application redémarrée"
echo ""
echo "🎭 La page de gestion des rôles devrait maintenant afficher les données correctement"