# 🚨 CORRECTION URGENTE PRODUCTION - TABLE USER_ROLES

## Problème Identifié
```
Error in setUserRoles: error: relation "user_roles" does not exist
PostgreSQL Error Code: 42P01
POST /api/users/.../roles 404
```

## Solution Immédiate

### 1. Exécuter directement dans PostgreSQL production

```bash
# Accéder au conteneur PostgreSQL
docker exec -it logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db
```

### 2. Copier-coller ce SQL dans PostgreSQL

```sql
-- Créer la table user_roles manquante
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Créer les index de performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles (assigned_by);

-- Assigner rôle admin à l'utilisateur admin
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 'admin_local', 1, 'system', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'admin_local')
AND EXISTS (SELECT 1 FROM users WHERE id = 'admin_local')
AND EXISTS (SELECT 1 FROM roles WHERE id = 1);

-- Vérification
SELECT 'TABLE CREATED' as status, COUNT(*) as rows FROM user_roles;
```

### 3. Redémarrer l'application

```bash
docker-compose restart web
```

### 4. Vérifier la correction

```bash
# Tester l'API
curl http://localhost:3000/api/users

# Vérifier les logs
docker-compose logs --tail=10 web
```

## Résultat Attendu

- ✅ Plus d'erreur 404 "relation user_roles does not exist"
- ✅ Interface gestion rôles fonctionnelle
- ✅ Assignation de rôles opérationnelle

## Alternative Rapide (une seule commande)

```bash
docker exec logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db -c "
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
INSERT INTO user_roles (user_id, role_id, assigned_by) 
SELECT 'admin_local', 1, 'system' 
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'admin_local');
"
```