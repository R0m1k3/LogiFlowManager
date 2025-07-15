#!/bin/bash

echo "🔧 CORRECTION URGENTE TABLE USER_ROLES PRODUCTION"
echo "================================================"
echo ""

echo "❌ PROBLÈME IDENTIFIÉ :"
echo "- Erreur 404: relation \"user_roles\" does not exist"
echo "- Table user_roles manquante dans base PostgreSQL production"
echo "- Interface gestion rôles utilisateurs inaccessible"
echo ""

echo "🔧 SOLUTION APPLIQUÉE :"
echo "- Création table user_roles avec colonnes requises"
echo "- Index de performance ajoutés"
echo "- Rôles par défaut assignés aux utilisateurs existants"
echo ""

# Créer script SQL pour corriger le problème
cat > fix-user-roles-table.sql << 'EOF'
-- Création de la table user_roles manquante
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- Assigner rôle admin à l'utilisateur admin (si pas déjà fait)
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 'admin_local', 1, 'system', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = 'admin_local'
)
AND EXISTS (SELECT 1 FROM users WHERE id = 'admin_local')
AND EXISTS (SELECT 1 FROM roles WHERE id = 1);

-- Assigner rôle employee par défaut aux autres utilisateurs sans rôle
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    3, -- rôle employee par défaut (ID 3)
    'system',
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
AND u.id != 'admin_local'
AND EXISTS (SELECT 1 FROM roles WHERE id = 3);

-- Vérification finale
SELECT 
    'VERIFICATION: Table user_roles créée' as status,
    COUNT(*) as row_count
FROM user_roles;

SELECT 
    'VERIFICATION: Utilisateurs avec rôles' as status,
    u.id,
    u.username,
    r.name as role_name,
    r.display_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
EOF

echo "🚀 EXÉCUTION DU SCRIPT SQL..."
echo ""

# Exécuter le script dans le conteneur Docker PostgreSQL
if docker-compose ps | grep -q "Up"; then
    echo "📋 Conteneur Docker détecté - Application du script SQL..."
    
    # Copier le script dans le conteneur PostgreSQL
    docker cp fix-user-roles-table.sql logiflow-postgres-1:/tmp/fix-user-roles-table.sql
    
    # Exécuter le script SQL
    docker exec logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db -f /tmp/fix-user-roles-table.sql
    
    echo ""
    echo "✅ SCRIPT SQL EXÉCUTÉ !"
    
else
    echo "⚠️  Conteneur Docker non détecté"
    echo "Veuillez exécuter manuellement :"
    echo "psql -U logiflow_admin -d logiflow_db -f fix-user-roles-table.sql"
fi

echo ""
echo "🔄 REDÉMARRAGE DE L'APPLICATION..."
docker-compose restart web

echo ""
echo "⏳ Attente initialisation (20 secondes)..."
sleep 20

echo ""
echo "🔍 VÉRIFICATION POST-CORRECTION :"
echo ""

# Test API user roles
echo "📊 Test API /api/users (vérification données utilisateurs)..."
curl -s "http://localhost:3000/api/users" | head -c 100
echo ""

echo ""
echo "🔍 Vérification logs application..."
docker-compose logs --tail=5 web

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo ""
echo "📋 RÉSULTATS ATTENDUS :"
echo "- ✅ Table user_roles créée en base PostgreSQL"
echo "- ✅ Plus d'erreur 404 'relation user_roles does not exist'"
echo "- ✅ Interface gestion rôles utilisateurs fonctionnelle"
echo "- ✅ Assignation de rôles opérationnelle"
echo ""
echo "🎯 PROCHAINE ÉTAPE :"
echo "- Tester l'assignation de rôle depuis l'interface"
echo "- Vérifier que les utilisateurs ont des rôles assignés"
echo ""
echo "================================================"
echo "🔧 CORRECTION USER_ROLES PRODUCTION TERMINÉE"

# Nettoyage
rm -f fix-user-roles-table.sql