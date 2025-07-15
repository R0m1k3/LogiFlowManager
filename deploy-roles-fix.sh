#!/bin/bash
echo "🔧 Déploiement des corrections de rôles en production"
echo "================================================="

echo "📋 Corrections à appliquer :"
echo "1. Ouvrir l'API /api/roles à tous les utilisateurs authentifiés"
echo "2. Ouvrir l'API /api/permissions à tous les utilisateurs authentifiés"
echo "3. Corriger les couleurs des rôles dans la base de données"
echo "4. Permettre aux managers d'accéder à l'API /api/users"
echo ""

echo "🛠️ Étape 1: Reconstruction du conteneur Docker"
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Attente du démarrage (30 secondes)..."
sleep 30

echo "🛠️ Étape 2: Correction des couleurs des rôles"
docker-compose exec -T db psql -U logiflow_admin -d logiflow_db << 'EOF'
UPDATE roles SET color = CASE 
    WHEN name = 'admin' THEN '#dc2626'
    WHEN name = 'manager' THEN '#2563eb'
    WHEN name = 'employee' THEN '#16a34a'
    WHEN name = 'directeur' THEN '#7c3aed'
    ELSE color 
END;

SELECT name, color FROM roles ORDER BY id;
EOF

echo "🔍 Étape 3: Vérification des services"
docker-compose ps

echo "🧪 Étape 4: Test des APIs"
echo "Testing http://localhost:3000/api/roles"
curl -s http://localhost:3000/api/roles | head -c 100
echo "..."
echo ""

echo "✅ Corrections déployées !"
echo "🌐 Accédez à: http://localhost:3000"
echo "👤 Connectez-vous avec: admin / admin"
echo "⚙️ Allez dans: Administration > Gestion des Rôles"
echo ""
echo "Les couleurs des rôles devraient maintenant s'afficher correctement."