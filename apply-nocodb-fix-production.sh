#!/bin/bash
# Script pour appliquer la correction NocoDB en production
# Supprime les colonnes obsolètes de la table nocodb_config

echo "🔧 Application de la correction NocoDB en production..."

# Arrêter le conteneur LogiFlow
echo "⏹️  Arrêt du conteneur LogiFlow..."
docker stop logiflow-app 2>/dev/null || echo "Conteneur déjà arrêté"

# Attendre un moment
sleep 2

# Appliquer le script SQL
echo "📊 Application du script SQL de correction..."
docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -f /docker-entrypoint-initdb.d/fix-nocodb-production.sql

if [ $? -eq 0 ]; then
    echo "✅ Script SQL appliqué avec succès"
else
    echo "❌ Erreur lors de l'application du script SQL"
    exit 1
fi

# Redémarrer le conteneur LogiFlow
echo "🚀 Redémarrage du conteneur LogiFlow..."
docker start logiflow-app

# Attendre que l'application soit prête
echo "⏳ Attente du démarrage de l'application..."
sleep 10

# Vérifier le statut
echo "🔍 Vérification du statut..."
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Application LogiFlow redémarrée avec succès"
    echo "🌐 Accessible sur http://localhost:3000"
else
    echo "⚠️  L'application met du temps à démarrer, vérifiez les logs avec:"
    echo "   docker logs logiflow-app"
fi

echo "🎉 Correction NocoDB terminée !"
echo ""
echo "📋 Actions effectuées :"
echo "   ✓ Suppression colonnes obsolètes (table_id, table_name, invoice_column_name)"
echo "   ✓ Table nocodb_config maintenant compatible avec l'architecture hybride"
echo "   ✓ Configuration globale centralisée + paramètres par magasin"
echo ""
echo "🔗 Test de création d'une configuration NocoDB maintenant possible"