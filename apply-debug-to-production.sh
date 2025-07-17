#!/bin/bash

echo "🚀 Application des corrections debug en production"
echo "⏱️  $(date '+%H:%M:%S') - Début du déploiement"

echo ""
echo "📝 Corrections à appliquer en production :"
echo "✅ Routes POST /api/groups avec logs détaillés"
echo "✅ Routes POST /api/suppliers avec logs détaillés"
echo "✅ Corrections apiRequest dans tous les composants frontend"
echo "✅ Logs d'erreur PostgreSQL complets"

echo ""
echo "🐳 Pour appliquer en production Docker :"
echo ""

echo "1️⃣ REBUILD ET REDÉPLOIEMENT :"
echo "cd /chemin/vers/logiflow"
echo "docker-compose down"
echo "docker-compose build --no-cache"
echo "docker-compose up -d"
echo ""

echo "2️⃣ OU MISE À JOUR VIA PULL :"
echo "# Si vous utilisez un registry Docker"
echo "docker pull votre-registry/logiflow:latest"
echo "docker-compose down && docker-compose up -d"
echo ""

echo "3️⃣ VÉRIFICATION APRÈS DÉPLOIEMENT :"
echo "docker logs -f logiflow-app"
echo "# Puis tester la création d'un groupe"
echo ""

echo "🔍 ALTERNATIVE - COPIE MANUELLE DES FICHIERS :"
echo "# Si vous avez accès aux fichiers directement"
echo "docker cp server/routes.production.ts logiflow-app:/app/server/"
echo "docker restart logiflow-app"
echo ""

echo "⚠️  NOTE IMPORTANTE :"
echo "Les logs de debug ne s'afficheront qu'APRÈS le redéploiement."
echo "Le code actuel en production n'a PAS encore ces logs détaillés."

echo ""
echo "⏱️  $(date '+%H:%M:%S') - Script prêt"
echo "🎯 ÉTAPE SUIVANTE : Redéployer en production puis tester la création"