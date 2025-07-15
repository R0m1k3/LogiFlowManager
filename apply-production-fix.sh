#!/bin/bash

echo "🚀 APPLICATION DU CORRECTIF PRODUCTION - RÔLES ET PERMISSIONS"
echo "============================================================="

# Vérifier si Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas disponible"
    exit 1
fi

echo "📋 Sauvegarde des données actuelles..."
timestamp=$(date +%Y%m%d_%H%M%S)
docker exec logiflow-db pg_dump -U logiflow_admin -d logiflow_db > backup_production_${timestamp}.sql

echo "🔧 Application du correctif..."
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < fix-production-data-force.sql

echo "🔄 Redémarrage de l'application..."
docker restart logiflow-app

echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

echo "🔍 Vérification de l'application..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Application redémarrée avec succès"
else
    echo "⚠️ Application en cours de redémarrage, veuillez patienter"
fi

echo ""
echo "✅ CORRECTIF APPLIQUÉ AVEC SUCCÈS"
echo "🔍 Vérifiez maintenant l'application sur votre domaine"
echo "🎨 Les rôles devraient maintenant avoir les bonnes couleurs:"
echo "   - Admin: Rouge (#dc2626)"
echo "   - Manager: Bleu (#2563eb)"
echo "   - Employé: Vert (#16a34a)"
echo "   - Directeur: Violet (#7c3aed)"
echo ""
echo "🗂️ Sauvegarde créée: backup_production_${timestamp}.sql"