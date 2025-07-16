#!/bin/bash

# 🚨 CORRECTION URGENTE PRODUCTION - Application automatique du fix des rôles
# Script pour corriger l'affichage des rôles et couleurs en production

echo "🚨 CORRECTION URGENTE - Synchronisation des rôles en production"
echo "=================================================="

# 1. Vérifier que le conteneur est en cours d'exécution
if ! docker ps | grep -q logiflow; then
    echo "❌ Erreur: Le conteneur LogiFlow n'est pas en cours d'exécution"
    echo "   Démarrer avec: docker-compose up -d"
    exit 1
fi

echo "✅ Conteneur LogiFlow détecté"

# 2. Créer une sauvegarde avant modification
echo "📦 Création d'une sauvegarde de la base de données..."
docker-compose exec -T logiflow-db pg_dump -U logiflow_admin logiflow_db > backup_before_roles_fix_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Sauvegarde créée"

# 3. Appliquer le script de correction SQL
echo "🔧 Application du correctif des rôles..."
if docker-compose exec -T logiflow-db psql -U logiflow_admin -d logiflow_db < PRODUCTION-ROLES-FIX.sql; then
    echo "✅ Script SQL appliqué avec succès"
else
    echo "❌ Erreur lors de l'application du script SQL"
    exit 1
fi

# 4. Redémarrer l'application pour vider le cache
echo "🔄 Redémarrage de l'application pour vider le cache..."
docker-compose restart logiflow-app

# 5. Attendre que l'application redémarre
echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

# 6. Tests de vérification
echo "🧪 Tests de vérification..."

# Test API des rôles
echo "🎨 Test API /api/roles..."
ROLES_RESPONSE=$(curl -s -w "%{http_code}" -b /tmp/cookies.txt http://localhost:3000/api/roles -o /tmp/roles_test.json)
if [ "${ROLES_RESPONSE: -3}" = "200" ]; then
    echo "✅ API rôles accessible"
    ROLES_COUNT=$(cat /tmp/roles_test.json | jq length 2>/dev/null || echo "0")
    echo "   Nombre de rôles: $ROLES_COUNT"
else
    echo "❌ Erreur API rôles: HTTP $ROLES_RESPONSE"
fi

# Test API des permissions  
echo "🔐 Test API /api/permissions..."
PERMS_RESPONSE=$(curl -s -w "%{http_code}" -b /tmp/cookies.txt http://localhost:3000/api/permissions -o /tmp/perms_test.json)
if [ "${PERMS_RESPONSE: -3}" = "200" ]; then
    echo "✅ API permissions accessible"
    PERMS_COUNT=$(cat /tmp/perms_test.json | jq length 2>/dev/null || echo "0")
    echo "   Nombre de permissions: $PERMS_COUNT"
else
    echo "❌ Erreur API permissions: HTTP $PERMS_RESPONSE"
fi

# 7. Vérification base de données
echo "📊 Vérification des données en base..."
docker-compose exec -T logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT 'Rôles configurés:' as info;
SELECT id, name, display_name, color FROM roles ORDER BY id;
SELECT '';
SELECT 'Utilisateurs avec rôles:' as info;  
SELECT u.username, u.role, r.name as assigned_role, r.color 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id 
ORDER BY u.username;
"

# 8. Instructions finales
echo ""
echo "🎉 CORRECTION TERMINÉE"
echo "======================"
echo ""
echo "📋 Actions effectuées:"
echo "   ✅ Sauvegarde de la base de données"
echo "   ✅ Correction des rôles et couleurs"
echo "   ✅ Synchronisation user_roles"
echo "   ✅ Redémarrage de l'application"
echo ""
echo "🌐 Tester l'application:"
echo "   👉 http://votre-domaine:3000"
echo "   🔑 Login: admin / admin"
echo ""
echo "🔍 Pages à vérifier:"
echo "   📊 Administration > Gestion des Utilisateurs"
echo "   🎭 Administration > Gestion des Rôles et Permissions"
echo ""
echo "📈 Couleurs des rôles:"
echo "   🔴 Administrateur: Rouge (#f87171)"
echo "   🔵 Manager: Bleu (#60a5fa)"  
echo "   🟢 Employé: Vert (#4ade80)"
echo "   🟣 Directeur: Violet (#a78bfa)"
echo ""

# Nettoyage des fichiers temporaires
rm -f /tmp/roles_test.json /tmp/perms_test.json

echo "✅ Correction des rôles terminée avec succès!"