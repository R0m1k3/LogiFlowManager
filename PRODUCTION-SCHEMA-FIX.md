# Correction Schéma Base de Données Production - LogiFlow

## Problème Identifié
```
❌ Error updating user: error: column "first_name" of relation "users" does not exist
```

La table `users` en production n'a pas les colonnes requises par l'application.

## Solution Immédiate

### 1. Exécutez le script de migration sur votre serveur de production :

```bash
# Copiez le script fix-database-schema-production.sh sur votre serveur
# Puis exécutez :
chmod +x fix-database-schema-production.sh
./fix-database-schema-production.sh
```

### 2. Ou exécutez les commandes manuellement :

```bash
# 1. Vérifiez les colonnes existantes
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"

# 2. Ajoutez les colonnes manquantes
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    END IF;
END \$\$;
"

# 3. Migrez les données existantes
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
UPDATE users 
SET 
    first_name = CASE 
        WHEN name IS NOT NULL AND name != '' THEN SPLIT_PART(name, ' ', 1)
        ELSE username
    END,
    last_name = CASE 
        WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN SPLIT_PART(name, ' ', 2)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;
"

# 4. Ajoutez les contraintes NOT NULL
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
"

# 5. Redémarrez l'application
docker-compose restart logiflow_app
```

## Vérification

Après la migration, vérifiez que tout fonctionne :

```bash
# Vérifiez le schéma
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"

# Vérifiez les données
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT id, username, first_name, last_name, email FROM users;"

# Testez la mise à jour d'un utilisateur
curl -X PUT http://localhost:3000/api/users/admin_local \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{
    "username": "admin",
    "firstName": "Admin",
    "lastName": "Test",
    "email": "admin@logiflow.com",
    "role": "admin"
  }'
```

## Colonnes Ajoutées

- `first_name` VARCHAR(255) NOT NULL
- `last_name` VARCHAR(255) NOT NULL  
- `profile_image_url` TEXT

## Migration des Données

Les données existantes seront migrées automatiquement :
- `first_name` = premier mot du champ `name` (ou `username` si `name` est vide)
- `last_name` = deuxième mot du champ `name` (ou chaîne vide)
- `profile_image_url` = NULL par défaut

## Résultat Attendu

Après la migration, l'erreur `column "first_name" of relation "users" does not exist` sera résolue et la modification des utilisateurs fonctionnera correctement.

## Prévention

Pour éviter ce problème à l'avenir, assurez-vous que :
1. Les migrations de schéma sont appliquées avant le déploiement
2. Le fichier `init.sql` est synchronisé avec le schéma Drizzle
3. Les tests incluent la vérification du schéma de base de données