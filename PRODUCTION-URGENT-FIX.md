# 🚨 CORRECTION URGENTE PRODUCTION

## Problème identifié
L'erreur `column "name" does not exist` indique que la base de données production n'a pas été mise à jour avec la nouvelle colonne.

## Solution immédiate

### 1. Corriger la base de données (PRIORITÉ 1)

Connectez-vous à votre conteneur PostgreSQL production :
```bash
docker-compose exec logiflow-db psql -U logiflow_admin -d logiflow_db
```

Puis exécutez cette commande SQL :
```sql
ALTER TABLE users ADD COLUMN name VARCHAR(255);
UPDATE users SET name = COALESCE(username, email) WHERE name IS NULL;
```

### 2. Vérifier la correction
```sql
\d users
SELECT id, username, email, name FROM users;
```

### 3. Redémarrer l'application
```bash
docker-compose restart logiflow-app
```

## Test de validation
- Accédez à `/groups` - devrait maintenant fonctionner
- Vérifiez que les groupes s'affichent correctement
- Testez la page Utilisateurs

## Si problème persiste
Reconstruire complètement :
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## État actuel
- ✅ Code corrigé dans les fichiers de développement
- ❌ Base de données production pas mise à jour
- 🎯 Action requise : Exécuter le SQL ci-dessus