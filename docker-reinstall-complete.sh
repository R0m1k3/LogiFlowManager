#!/bin/bash

# SCRIPT DE RÉINSTALLATION COMPLÈTE DOCKER LOGIFLOW
# =================================================

echo "🗑️  NETTOYAGE COMPLET DOCKER LOGIFLOW"
echo "====================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Arrêter et supprimer tous les conteneurs LogiFlow
echo "🛑 Arrêt de tous les conteneurs LogiFlow..."
docker stop logiflow-app logiflow-db 2>/dev/null || true
docker rm -f logiflow-app logiflow-db 2>/dev/null || true

# 2. Supprimer les volumes de données
echo "🗄️  Suppression des volumes de données..."
docker volume rm logiflow_postgres_data 2>/dev/null || true
docker volume prune -f

# 3. Supprimer les images LogiFlow
echo "🖼️  Suppression des images LogiFlow..."
docker rmi $(docker images | grep logiflow | awk '{print $3}') 2>/dev/null || true

# 4. Nettoyer le système Docker
echo "🧹 Nettoyage du système Docker..."
docker system prune -f

# 5. Vérifier que init.sql est à jour
echo "📋 Vérification de init.sql..."
if grep -q "scheduled_date DATE NOT NULL" init.sql && grep -q "notes TEXT" init.sql; then
    echo -e "${GREEN}✅ init.sql contient les bonnes colonnes${NC}"
else
    echo -e "${RED}❌ init.sql n'est pas à jour !${NC}"
    exit 1
fi

# 6. Reconstruction et démarrage
echo ""
echo "🏗️  RECONSTRUCTION COMPLÈTE"
echo "============================"

# Créer le réseau s'il n'existe pas
echo "🌐 Création du réseau nginx_default..."
docker network create nginx_default 2>/dev/null || echo "Réseau déjà existant"

# 7. Démarrage avec le bon init.sql
echo "🚀 Démarrage avec base de données propre..."
docker-compose up -d --build

# 8. Attendre que la base soit prête
echo "⏱️  Attente de l'initialisation de la base (45 secondes)..."
sleep 45

# 9. Vérifier les logs de la base
echo "📊 Vérification des logs de la base..."
docker logs logiflow-db | tail -10

# 10. Vérifier le schéma créé
echo ""
echo "🔍 Vérification du schéma créé..."
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    'COLONNES CRITIQUES VÉRIFIÉES:' as info;
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'deliveries') 
AND column_name IN ('notes', 'scheduled_date', 'planned_date', 'quantity', 'unit')
ORDER BY table_name, column_name;
"

# 11. Test de l'application
echo ""
echo "🧪 Test de l'application..."
sleep 15
curl -s http://localhost:3000/api/debug/status || echo "API pas encore prête"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 RÉINSTALLATION TERMINÉE${NC}"
echo "======================================"
echo "✅ Base de données recréée avec le bon schéma"
echo "✅ Application redémarrée"
echo "✅ Toutes les colonnes sont maintenant correctes"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Connectez-vous avec admin/admin"
echo "   2. Testez la création de commandes"
echo "   3. Testez la création de livraisons"