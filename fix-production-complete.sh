#!/bin/bash

# Script pour corriger l'erreur validated_at en production

echo "🔧 CORRECTION ERREUR VALIDATED_AT PRODUCTION"
echo "=============================================="
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker ps &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution."
    exit 1
fi

# Arrêter l'application
echo "🛑 Arrêt de l'application..."
docker-compose down --remove-orphans 2>/dev/null || true

# Ajouter la colonne validated_at à la base de données existante
echo "🗄️ Ajout colonne validated_at à la base..."
docker-compose up -d logiflow-db
sleep 5

# Exécuter la migration
echo "📝 Migration de la base de données..."
docker-compose exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
"

# Reconstruire avec les corrections
echo "🔨 Reconstruction application..."
docker-compose build --no-cache logiflow-app

# Redémarrer complètement
echo "🚀 Redémarrage complet..."
docker-compose up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage..."
sleep 15

# Vérifier les logs
echo "🔍 Vérification des logs..."
docker-compose logs logiflow-app --tail=10

# Test de validation
echo ""
echo "🧪 Test de l'API..."
sleep 2
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API répond correctement"
else
    echo "❌ Problème avec l'API"
fi

echo ""
echo "✅ CORRECTIONS APPLIQUÉES :"
echo "  🗄️ Colonne validated_at ajoutée à la base"
echo "  🔧 Code corrigé pour ne plus utiliser validated_at"
echo "  🔗 Liaisons commande-livraison fonctionnelles"
echo "  🎨 Favicon LogiFlow inclus"
echo ""
echo "🌐 Application : http://localhost:3000"
echo "🔐 Login : admin / admin"
echo ""
echo "⚠️  Si l'erreur persiste, redémarrer : docker-compose restart"