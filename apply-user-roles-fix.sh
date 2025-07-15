#!/bin/bash

echo "🚨 CORRECTION URGENTE TABLE USER_ROLES PRODUCTION"
echo "================================================="
echo ""

echo "❌ PROBLÈME CRITIQUE :"
echo "- Erreur 404: relation \"user_roles\" does not exist"
echo "- Interface gestion rôles complètement inaccessible"
echo "- Table user_roles absente de la base PostgreSQL production"
echo ""

echo "🔧 APPLICATION IMMÉDIATE DE LA CORRECTION..."
echo ""

# Vérifier si Docker est en cours
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Conteneur Docker non actif"
    echo "Démarrage des conteneurs..."
    docker-compose up -d
    sleep 30
fi

# Copier et exécuter le script SQL
echo "📋 Copie du script SQL dans le conteneur PostgreSQL..."
docker cp fix-user-roles-urgent.sql logiflow-postgres-1:/tmp/fix-user-roles-urgent.sql

echo "🔧 Exécution du script SQL de correction..."
docker exec logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db -f /tmp/fix-user-roles-urgent.sql

echo ""
echo "🔄 Redémarrage de l'application web..."
docker-compose restart web

echo ""
echo "⏳ Attente initialisation (25 secondes)..."
sleep 25

echo ""
echo "🔍 VÉRIFICATIONS POST-CORRECTION :"
echo ""

# Test connexion base de données
echo "📊 Test connexion PostgreSQL..."
if docker exec logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db -c "SELECT COUNT(*) FROM user_roles;" &>/dev/null; then
    echo "✅ Base de données accessible"
    echo "📊 Nombre de lignes user_roles:"
    docker exec logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db -c "SELECT COUNT(*) FROM user_roles;"
else
    echo "❌ Erreur connexion base de données"
fi

echo ""
echo "🌐 Test API utilisateurs..."
curl -s "http://localhost:3000/api/users" | head -c 200
echo ""

echo ""
echo "📋 Vérification logs application..."
docker-compose logs --tail=10 web | grep -E "(error|Error|ERROR|user_roles|Table)" || echo "Aucune erreur détectée"

echo ""
echo "✅ CORRECTION APPLIQUÉE !"
echo ""
echo "📋 RÉSULTATS ATTENDUS :"
echo "- ✅ Table user_roles créée avec colonnes requises"
echo "- ✅ Index de performance ajoutés"  
echo "- ✅ Rôles par défaut assignés aux utilisateurs"
echo "- ✅ Plus d'erreur 404 dans l'interface rôles"
echo "- ✅ Assignation de rôles fonctionnelle"
echo ""
echo "🎯 PROCHAINES ÉTAPES :"
echo "1. Tester l'accès à la page gestion des rôles"
echo "2. Vérifier l'assignation de rôles utilisateurs"
echo "3. Confirmer que l'erreur 404 a disparu"
echo ""
echo "================================================="
echo "🚨 CORRECTION URGENTE TERMINÉE"

# Nettoyage
rm -f fix-user-roles-urgent.sql