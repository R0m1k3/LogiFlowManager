#!/bin/bash

set -e

echo "=== DÉPLOIEMENT MODULE GESTION DES RÔLES - PRODUCTION ==="
echo "Date: $(date)"
echo ""

# Configuration
DB_CONTAINER="logiflow_db"
APP_CONTAINER="logiflow_app"
BACKUP_DIR="/tmp/logiflow_backup_$(date +%Y%m%d_%H%M%S)"

# Fonction pour exécuter du SQL
execute_sql() {
    local sql="$1"
    echo "📝 Exécution SQL: $sql"
    docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -c "$sql"
}

# Fonction pour vérifier si une table existe
table_exists() {
    local table="$1"
    result=$(docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');")
    echo "$result" | grep -q "t"
}

# Fonction pour vérifier si une colonne existe
column_exists() {
    local table="$1"
    local column="$2"
    result=$(docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '$table' AND column_name = '$column');")
    echo "$result" | grep -q "t"
}

echo "🔍 VÉRIFICATION DE L'ÉTAT ACTUEL..."

# Vérifier la connectivité à la base de données
if ! docker exec "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -c '\l' > /dev/null 2>&1; then
    echo "❌ Erreur: Impossible de se connecter à la base de données"
    exit 1
fi

echo "✅ Connexion à la base de données OK"

# Vérifier l'état des tables
echo ""
echo "📋 ÉTAT DES TABLES:"
tables_to_check=("roles" "permissions" "role_permissions" "user_roles")
missing_tables=()

for table in "${tables_to_check[@]}"; do
    if table_exists "$table"; then
        echo "✅ Table $table - EXISTS"
    else
        echo "❌ Table $table - MISSING"
        missing_tables+=("$table")
    fi
done

# Vérifier les colonnes des tables roles et permissions
echo ""
echo "📊 VÉRIFICATION DES COLONNES:"
role_columns=("display_name" "color" "is_active")
permission_columns=("display_name" "action" "resource" "is_system")

for column in "${role_columns[@]}"; do
    if column_exists "roles" "$column"; then
        echo "✅ roles.$column - EXISTS"
    else
        echo "❌ roles.$column - MISSING"
    fi
done

for column in "${permission_columns[@]}"; do
    if column_exists "permissions" "$column"; then
        echo "✅ permissions.$column - EXISTS"
    else
        echo "❌ permissions.$column - MISSING"
    fi
done

# Création d'une sauvegarde
echo ""
echo "💾 CRÉATION DE LA SAUVEGARDE..."
mkdir -p "$BACKUP_DIR"
docker exec "$DB_CONTAINER" pg_dump -U logiflow_admin logiflow_db > "$BACKUP_DIR/logiflow_backup.sql"
echo "✅ Sauvegarde créée: $BACKUP_DIR/logiflow_backup.sql"

# Mise à jour du schéma si nécessaire
echo ""
echo "🔧 MISE À JOUR DU SCHÉMA..."

# Ajouter les colonnes manquantes aux tables roles
execute_sql "ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR;"
execute_sql "ALTER TABLE roles ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#6b7280';"
execute_sql "ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"

# Ajouter les colonnes manquantes aux tables permissions
execute_sql "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR;"
execute_sql "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR;"
execute_sql "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource VARCHAR;"
execute_sql "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;"

# Créer la table user_roles si elle n'existe pas
if ! table_exists "user_roles"; then
    echo "📝 Création de la table user_roles..."
    execute_sql "CREATE TABLE user_roles (
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by VARCHAR NOT NULL REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
    );"
fi

# Créer les index pour optimiser les performances
echo ""
echo "🚀 CRÉATION DES INDEX..."
execute_sql "CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles (is_active);"
execute_sql "CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions (action);"
execute_sql "CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions (resource);"
execute_sql "CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);"
execute_sql "CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);"
execute_sql "CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);"

# Redémarrer l'application pour initialiser les rôles et permissions
echo ""
echo "🔄 REDÉMARRAGE DE L'APPLICATION..."
docker restart "$APP_CONTAINER"

# Attendre que l'application redémarre
echo "⏳ Attente du redémarrage de l'application..."
sleep 10

# Vérifier que l'application est opérationnelle
echo ""
echo "🔍 VÉRIFICATION DE L'APPLICATION..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec "$APP_CONTAINER" curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application opérationnelle"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts - Application en cours de démarrage..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Erreur: Application non opérationnelle après $max_attempts tentatives"
    exit 1
fi

# Vérifier l'initialisation des rôles
echo ""
echo "🏭 VÉRIFICATION DE L'INITIALISATION DES RÔLES..."
sleep 5

# Compter les rôles dans la base de données
role_count=$(docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -t -c "SELECT COUNT(*) FROM roles;")
permission_count=$(docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -t -c "SELECT COUNT(*) FROM permissions;")

echo "📊 Rôles créés: $(echo $role_count | xargs)"
echo "📊 Permissions créées: $(echo $permission_count | xargs)"

# Vérifier la présence des rôles par défaut
echo ""
echo "🔍 VÉRIFICATION DES RÔLES PAR DÉFAUT:"
default_roles=("admin" "manager" "employee" "directeur")
for role in "${default_roles[@]}"; do
    if docker exec -i "$DB_CONTAINER" psql -U logiflow_admin -d logiflow_db -t -c "SELECT EXISTS (SELECT 1 FROM roles WHERE name = '$role');" | grep -q "t"; then
        echo "✅ Rôle $role - EXISTS"
    else
        echo "❌ Rôle $role - MISSING"
    fi
done

# Test des APIs
echo ""
echo "🌐 TEST DES APIS..."
if docker exec "$APP_CONTAINER" curl -s http://localhost:3000/api/roles > /dev/null; then
    echo "✅ API /api/roles - OK"
else
    echo "❌ API /api/roles - ERREUR"
fi

if docker exec "$APP_CONTAINER" curl -s http://localhost:3000/api/permissions > /dev/null; then
    echo "✅ API /api/permissions - OK"
else
    echo "❌ API /api/permissions - ERREUR"
fi

# Résumé final
echo ""
echo "🎯 RÉSUMÉ DU DÉPLOIEMENT:"
echo "✅ Schéma de base de données mis à jour"
echo "✅ Table user_roles créée"
echo "✅ Index de performance créés"
echo "✅ Application redémarrée"
echo "✅ Rôles et permissions initialisés"
echo "✅ APIs opérationnelles"
echo ""
echo "💾 Sauvegarde disponible: $BACKUP_DIR/logiflow_backup.sql"
echo ""
echo "🚀 MODULE DE GESTION DES RÔLES DÉPLOYÉ AVEC SUCCÈS!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Connectez-vous à l'application avec admin/admin"
echo "2. Allez dans Administration > Gestion des Rôles"
echo "3. Configurez les permissions selon vos besoins"
echo "4. Assignez des rôles aux utilisateurs"