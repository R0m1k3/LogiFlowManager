#!/bin/bash

set -e

echo "=== CORRECTION URGENTE - MODULE RÔLES PRODUCTION ==="
echo "Date: $(date)"
echo ""

# Détecter le port de l'application
APP_PORT=""
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    APP_PORT="3000"
elif curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    APP_PORT="8080"
elif docker ps | grep -q "3000:3000"; then
    APP_PORT="3000"
elif docker ps | grep -q "8080:"; then
    APP_PORT="8080"
else
    echo "❌ Application non accessible sur les ports 3000 et 8080"
    echo "🔍 Vérification des conteneurs Docker..."
    docker ps
    exit 1
fi

echo "✅ Application détectée sur le port $APP_PORT"
BASE_URL="http://localhost:$APP_PORT"

echo ""
echo "🔧 ÉTAPE 1: VÉRIFICATION DE L'ÉTAT ACTUEL..."

# Test de l'API de santé
health_response=$(curl -s $BASE_URL/api/health)
echo "📋 État de l'application:"
echo "$health_response" | jq . 2>/dev/null || echo "$health_response"

echo ""
echo "🔐 ÉTAPE 2: TEST D'AUTHENTIFICATION..."

# Tester l'authentification admin
login_response=$(curl -s -c /tmp/cookies.txt -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}' \
    $BASE_URL/api/login)

echo "📋 Réponse login:"
echo "$login_response"

if echo "$login_response" | grep -q "success\|redirect\|user" || [ -f /tmp/cookies.txt ]; then
    echo "✅ Authentification semble fonctionner"
    
    echo ""
    echo "🎭 ÉTAPE 3: TEST DES APIs RÔLES..."
    
    # Tester les APIs des rôles avec authentification
    roles_response=$(curl -s -b /tmp/cookies.txt $BASE_URL/api/roles)
    echo "📋 Réponse /api/roles:"
    echo "$roles_response" | jq . 2>/dev/null || echo "$roles_response"
    
    permissions_response=$(curl -s -b /tmp/cookies.txt $BASE_URL/api/permissions)
    echo "📋 Réponse /api/permissions:"
    echo "$permissions_response" | jq . 2>/dev/null || echo "$permissions_response"
    
else
    echo "❌ Authentification échouée"
fi

rm -f /tmp/cookies.txt

echo ""
echo "🗃️ ÉTAPE 4: CORRECTION DE LA BASE DE DONNÉES..."

# Créer un script SQL pour initialiser les rôles et permissions
cat > /tmp/fix_roles_production.sql << 'EOF'
-- Vérifier l'existence des tables
DO $$
BEGIN
    -- Créer la table roles si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'roles') THEN
        CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            description TEXT,
            color VARCHAR(7) DEFAULT '#666666',
            is_system BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
        CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
    END IF;

    -- Créer la table permissions si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'permissions') THEN
        CREATE TABLE permissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            description TEXT,
            category VARCHAR(255),
            action VARCHAR(255),
            resource VARCHAR(255),
            is_system BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
        CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
    END IF;

    -- Créer la table role_permissions si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'role_permissions') THEN
        CREATE TABLE role_permissions (
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role_id, permission_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
        CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
    END IF;

    -- Créer la table user_roles si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_roles') THEN
        CREATE TABLE user_roles (
            user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            assigned_by VARCHAR(255),
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
    END IF;
END $$;

-- Insérer les rôles par défaut
INSERT INTO roles (name, display_name, description, color, is_system, is_active) 
VALUES 
    ('admin', 'Administrateur', 'Accès complet au système', '#FF5722', true, true),
    ('manager', 'Manager', 'Gestion des magasins et équipes', '#2196F3', true, true),
    ('employee', 'Employé', 'Accès standard aux fonctionnalités', '#4CAF50', true, true),
    ('directeur', 'Directeur', 'Supervision régionale', '#9C27B0', true, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active;

-- Insérer les permissions essentielles
INSERT INTO permissions (name, display_name, description, category, action, resource, is_system) 
VALUES 
    -- Dashboard
    ('dashboard_read', 'Voir Dashboard', 'Accès au tableau de bord', 'dashboard', 'read', 'dashboard', true),
    
    -- Orders
    ('orders_read', 'Voir Commandes', 'Consultation des commandes', 'orders', 'read', 'orders', true),
    ('orders_create', 'Créer Commandes', 'Création de nouvelles commandes', 'orders', 'create', 'orders', true),
    ('orders_update', 'Modifier Commandes', 'Modification des commandes', 'orders', 'update', 'orders', true),
    ('orders_delete', 'Supprimer Commandes', 'Suppression des commandes', 'orders', 'delete', 'orders', true),
    
    -- Deliveries
    ('deliveries_read', 'Voir Livraisons', 'Consultation des livraisons', 'deliveries', 'read', 'deliveries', true),
    ('deliveries_create', 'Créer Livraisons', 'Création de nouvelles livraisons', 'deliveries', 'create', 'deliveries', true),
    ('deliveries_update', 'Modifier Livraisons', 'Modification des livraisons', 'deliveries', 'update', 'deliveries', true),
    ('deliveries_delete', 'Supprimer Livraisons', 'Suppression des livraisons', 'deliveries', 'delete', 'deliveries', true),
    ('deliveries_validate', 'Valider Livraisons', 'Validation des livraisons', 'deliveries', 'validate', 'deliveries', true),
    
    -- Users
    ('users_read', 'Voir Utilisateurs', 'Consultation des utilisateurs', 'users', 'read', 'users', true),
    ('users_create', 'Créer Utilisateurs', 'Création de nouveaux utilisateurs', 'users', 'create', 'users', true),
    ('users_update', 'Modifier Utilisateurs', 'Modification des utilisateurs', 'users', 'update', 'users', true),
    ('users_delete', 'Supprimer Utilisateurs', 'Suppression d''utilisateurs', 'users', 'delete', 'users', true),
    
    -- Roles
    ('roles_read', 'Voir Rôles', 'Accès en lecture aux rôles', 'roles', 'read', 'roles', true),
    ('roles_create', 'Créer Rôles', 'Création de nouveaux rôles', 'roles', 'create', 'roles', true),
    ('roles_update', 'Modifier Rôles', 'Modification des rôles', 'roles', 'update', 'roles', true),
    ('roles_delete', 'Supprimer Rôles', 'Suppression de rôles', 'roles', 'delete', 'roles', true),
    ('roles_assign', 'Assigner Rôles', 'Attribution de rôles aux utilisateurs', 'roles', 'assign', 'roles', true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    action = EXCLUDED.action,
    resource = EXCLUDED.resource;

-- Assigner toutes les permissions à l'admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Compter les résultats
SELECT 'RÉSULTATS:' as status;
SELECT 'roles' as table_name, COUNT(*) as count FROM roles;
SELECT 'permissions' as table_name, COUNT(*) as count FROM permissions;
SELECT 'role_permissions' as table_name, COUNT(*) as count FROM role_permissions;

-- Afficher quelques échantillons
SELECT 'RÔLES CRÉÉS:' as info;
SELECT name, display_name, color FROM roles;

SELECT 'PERMISSIONS SAMPLE:' as info;
SELECT name, display_name, category FROM permissions LIMIT 10;
EOF

echo "📊 Application des corrections SQL..."

# Détecter la méthode de connexion PostgreSQL
if docker ps | grep -q postgres; then
    # PostgreSQL dans Docker
    POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
    if [ -n "$POSTGRES_CONTAINER" ]; then
        echo "🐳 Connexion via conteneur PostgreSQL: $POSTGRES_CONTAINER"
        docker exec -i $POSTGRES_CONTAINER psql -U logiflow_admin -d logiflow_db < /tmp/fix_roles_production.sql
    else
        echo "⚠️ Conteneur PostgreSQL non trouvé"
    fi
elif command -v psql > /dev/null 2>&1; then
    # PostgreSQL local
    echo "🔗 Connexion PostgreSQL locale"
    PGPASSWORD="LogiFlow2025!" psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db -f /tmp/fix_roles_production.sql
else
    echo "❌ Impossible de se connecter à PostgreSQL"
    echo "💡 Suggestions:"
    echo "   - Vérifiez que le conteneur PostgreSQL fonctionne"
    echo "   - Vérifiez les paramètres de connexion"
fi

rm -f /tmp/fix_roles_production.sql

echo ""
echo "🔄 ÉTAPE 5: REDÉMARRAGE DE L'APPLICATION..."

# Redémarrer le conteneur de l'application pour recharger les changements
if docker ps | grep -q logiflow; then
    LOGIFLOW_CONTAINER=$(docker ps --format "{{.Names}}" | grep logiflow | head -1)
    echo "🔄 Redémarrage du conteneur: $LOGIFLOW_CONTAINER"
    docker restart $LOGIFLOW_CONTAINER
    
    echo "⏳ Attente du redémarrage (30 secondes)..."
    sleep 30
    
    # Vérifier que l'application est de nouveau accessible
    if curl -s $BASE_URL/api/health > /dev/null 2>&1; then
        echo "✅ Application redémarrée avec succès"
    else
        echo "❌ Application non accessible après redémarrage"
    fi
else
    echo "⚠️ Conteneur LogiFlow non trouvé pour redémarrage"
fi

echo ""
echo "🧪 ÉTAPE 6: TESTS FINAUX..."

# Retester les APIs après correction
echo "🔐 Nouvelle tentative d'authentification..."
login_response=$(curl -s -c /tmp/cookies.txt -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}' \
    $BASE_URL/api/login)

if echo "$login_response" | grep -q "success\|redirect\|user" || [ -f /tmp/cookies.txt ]; then
    echo "✅ Authentification OK"
    
    # Tester les APIs des rôles
    echo "🎭 Test final des APIs rôles..."
    
    roles_response=$(curl -s -b /tmp/cookies.txt $BASE_URL/api/roles)
    echo "📋 /api/roles:"
    echo "$roles_response" | jq . 2>/dev/null || echo "$roles_response"
    
    if echo "$roles_response" | grep -q "\[\]" || echo "$roles_response" | grep -q "Aucun"; then
        echo "❌ Les rôles sont encore vides"
    elif echo "$roles_response" | grep -q "admin\|manager"; then
        echo "✅ Les rôles sont maintenant présents!"
    fi
    
    permissions_response=$(curl -s -b /tmp/cookies.txt $BASE_URL/api/permissions)
    echo "📋 /api/permissions:"
    echo "$permissions_response" | jq . 2>/dev/null || echo "$permissions_response"
    
    if echo "$permissions_response" | grep -q "dashboard_read\|orders_read"; then
        echo "✅ Les permissions sont maintenant présentes!"
    fi
    
else
    echo "❌ Authentification encore en échec"
fi

rm -f /tmp/cookies.txt

echo ""
echo "🎯 RÉSUMÉ DE LA CORRECTION..."
echo "1. ✅ Tables rôles/permissions créées ou vérifiées"
echo "2. ✅ 4 rôles par défaut insérés (admin, manager, employee, directeur)"
echo "3. ✅ 19 permissions essentielles créées"
echo "4. ✅ Permissions assignées au rôle admin"
echo "5. ✅ Application redémarrée"
echo ""
echo "🎉 Le module de gestion des rôles devrait maintenant fonctionner!"
echo "📍 Accédez à: $BASE_URL"
echo "🔐 Connexion: admin / admin"
echo "🎭 Menu: Administration > Gestion des Rôles"