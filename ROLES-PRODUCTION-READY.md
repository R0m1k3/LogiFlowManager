# 🚨 CORRECTION IMMÉDIATE - TABLE USER_ROLES PRODUCTION

## PROBLÈME ACTUEL
```
Error: relation "user_roles" does not exist
PostgreSQL Code: 42P01
Status: 404 - Interface rôles inaccessible
```

## SOLUTION EN 3 ÉTAPES

### ÉTAPE 1: Créer le fichier SQL
Créer un fichier `create-user-roles.sql` avec ce contenu :

```sql
-- Création table user_roles manquante
CREATE TABLE user_roles (
    user_id VARCHAR NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by VARCHAR NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Index de performance
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- Rôle admin par défaut
INSERT INTO user_roles (user_id, role_id, assigned_by) 
VALUES ('admin_local', 1, 'system')
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 'SUCCESS: Table user_roles created' as result;
SELECT COUNT(*) as user_roles_count FROM user_roles;
```

### ÉTAPE 2: Exécuter en production

**Option A - Commande directe:**
```bash
docker exec -i logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db < create-user-roles.sql
```

**Option B - Interactive:**
```bash
docker exec -it logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db
```
Puis copier-coller le SQL ci-dessus.

### ÉTAPE 3: Redémarrer l'application
```bash
docker-compose restart web
```

## VÉRIFICATION
Après correction, vous devriez voir :
- ✅ Plus d'erreur 404 dans les logs
- ✅ Interface "Gestion des rôles" accessible
- ✅ Assignation de rôles fonctionnelle

## COMMANDE ALTERNATIVE (UNE LIGNE)
```bash
echo "CREATE TABLE user_roles (user_id VARCHAR NOT NULL, role_id INTEGER NOT NULL, assigned_by VARCHAR NOT NULL, assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, role_id)); CREATE INDEX idx_user_roles_user_id ON user_roles (user_id); INSERT INTO user_roles VALUES ('admin_local', 1, 'system');" | docker exec -i logiflow-postgres-1 psql -U logiflow_admin -d logiflow_db
```

## EN CAS D'ÉCHEC
Si les commandes Docker ne fonctionnent pas :
1. Vérifier que les conteneurs sont démarrés : `docker-compose ps`
2. Vérifier les noms des conteneurs : `docker ps`
3. Adapter le nom du conteneur PostgreSQL dans les commandes