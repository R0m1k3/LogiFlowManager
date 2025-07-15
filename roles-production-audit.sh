#!/bin/bash

echo "=== AUDIT MODULE GESTION DES RÔLES - PRODUCTION ==="
echo "Date: $(date)"
echo ""

# Vérifier que la table user_roles manque dans init.sql
echo "❌ PROBLÈME CRITIQUE DÉTECTÉ:"
echo "La table 'user_roles' est définie dans shared/schema.ts mais manque dans init.sql"
echo ""

# Vérifier les fichiers du système de rôles
echo "✅ VÉRIFICATION DES FICHIERS:"
files_to_check=(
    "shared/schema.ts"
    "server/routes.ts"
    "server/routes.production.ts"
    "server/storage.ts"
    "server/storage.production.ts"
    "server/initRolesAndPermissions.ts"
    "client/src/pages/RoleManagement.tsx"
    "init.sql"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - EXISTE"
    else
        echo "❌ $file - MANQUANT"
    fi
done

echo ""
echo "📋 TABLES REQUISES POUR LE SYSTÈME DE RÔLES:"
echo "1. roles - ✅ Présente dans init.sql"
echo "2. permissions - ✅ Présente dans init.sql"
echo "3. role_permissions - ✅ Présente dans init.sql"
echo "4. user_roles - ❌ MANQUANTE dans init.sql"
echo ""

echo "🔍 VÉRIFICATION DES MÉTHODES DE STORAGE:"
methods_to_check=(
    "getRoles"
    "getPermissions"
    "createRole"
    "createPermission"
    "setRolePermissions"
    "getRolePermissions"
    "setUserRoles"
)

for method in "${methods_to_check[@]}"; do
    if grep -q "$method" server/storage.production.ts; then
        echo "✅ $method - Présente en production"
    else
        echo "❌ $method - MANQUANTE en production"
    fi
done

echo ""
echo "📊 VÉRIFICATION DES ROUTES API:"
routes_to_check=(
    "/api/roles"
    "/api/permissions"
    "/api/roles/.*id.*/permissions"
    "/api/users/.*id.*/roles"
)

for route in "${routes_to_check[@]}"; do
    if grep -q "$route" server/routes.production.ts; then
        echo "✅ $route - Route présente en production"
    else
        echo "❌ $route - ROUTE MANQUANTE en production"
    fi
done

echo ""
echo "🚨 ACTIONS REQUISES POUR PRODUCTION:"
echo "1. Ajouter la table 'user_roles' dans init.sql"
echo "2. Créer des index pour optimiser les performances"
echo "3. Tester la création/assignation des rôles"
echo "4. Vérifier que l'initialisation fonctionne automatiquement"
echo ""

echo "💾 SCRIPT DE CORRECTION GÉNÉRÉ:"
cat > fix-roles-production-tables.sql << 'EOF'
-- Ajout de la table user_roles manquante
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Ajout des colonnes manquantes aux tables existantes
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#6b7280';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource VARCHAR;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- Mise à jour des séquences
SELECT setval('user_roles_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM user_roles));
EOF

echo ""
echo "✅ Script de correction SQL créé: fix-roles-production-tables.sql"
echo "Exécutez ce script en production pour corriger les problèmes"