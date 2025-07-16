# 🚨 CORRECTION URGENTE NOCODB PRODUCTION

## 📋 Problème confirmé
La base de données de production contient encore les colonnes obsolètes :
- `table_id` (NOT NULL) ❌
- `table_name` (NOT NULL) ❌  
- `invoice_column_name` (NOT NULL) ❌

Ces colonnes doivent être supprimées pour permettre la création de configurations NocoDB.

## 🔧 SOLUTION IMMÉDIATE

### Option 1: Connexion directe PostgreSQL (Recommandée)
Si vous avez accès direct à PostgreSQL :

```bash
# Se connecter à la base de données
psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db

# Ou avec l'URL complète
psql "postgresql://logiflow_admin:LogiFlow2025!@localhost:5434/logiflow_db"
```

Puis exécuter dans psql :
```sql
-- Copier-coller ces commandes une par une
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;

-- Vérifier la correction
\d nocodb_config
```

### Option 2: Via Docker (si le conteneur PostgreSQL est accessible)
```bash
# Méthode 1: Commande unique
docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c "ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id, DROP COLUMN IF EXISTS table_name, DROP COLUMN IF EXISTS invoice_column_name;"

# Méthode 2: Script complet
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db < fix-nocodb-production-urgent.sql
```

### Option 3: Via pgAdmin ou autre client GUI
Si vous utilisez pgAdmin ou un autre client graphique :

1. Ouvrir la base de données `logiflow_db`
2. Naviguer vers `Schemas > public > Tables > nocodb_config`
3. Faire clic droit sur la table → "Properties"
4. Aller dans l'onglet "Columns"
5. Supprimer les colonnes : `table_id`, `table_name`, `invoice_column_name`

## ✅ VÉRIFICATION DE LA CORRECTION

### Méthode 1: Vérification structure
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'nocodb_config' 
ORDER BY ordinal_position;
```

**Résultat attendu :**
```
column_name     | data_type | is_nullable
id              | integer   | NO
name            | character | NO
base_url        | character | NO
project_id      | character | NO
api_token       | character | NO
description     | text      | YES
is_active       | boolean   | YES
created_by      | character | NO
created_at      | timestamp | YES
updated_at      | timestamp | YES
```

### Méthode 2: Test d'insertion
```sql
INSERT INTO nocodb_config (name, base_url, project_id, api_token, description, is_active, created_by)
VALUES ('Test', 'https://test.com', 'test', 'token', 'Test', true, 'admin_local');

-- Vérifier l'insertion
SELECT * FROM nocodb_config WHERE name = 'Test';

-- Supprimer le test
DELETE FROM nocodb_config WHERE name = 'Test';
```

## 🔄 REDÉMARRAGE APPLICATION

Après la correction SQL, redémarrer l'application :

```bash
# Via Docker Compose
docker-compose restart logiflow-app

# Ou via Docker
docker restart logiflow-app
```

## 🧪 TEST FINAL

1. **Accéder à l'interface d'administration**
2. **Aller dans "Configuration NocoDB"**
3. **Créer une nouvelle configuration avec :**
   - Nom : "NocoDB Production"
   - URL : "https://nocodb.ffnancy.fr"
   - Projet ID : "admin"
   - Token : "z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ"

4. **Vérifier qu'il n'y a plus d'erreur 500**

## 🆘 EN CAS DE PROBLÈME

Si la correction échoue, vous pouvez :

1. **Vérifier l'état de la base** :
   ```sql
   \d nocodb_config
   ```

2. **Voir les erreurs** :
   ```sql
   SELECT * FROM nocodb_config LIMIT 1;
   ```

3. **Contacter le support** avec les logs exacts

## 📞 COMMANDES DE DIAGNOSTIC

```bash
# Vérifier les conteneurs
docker ps | grep logiflow

# Voir les logs de l'application
docker logs logiflow-app --tail 50

# Vérifier la connexion PostgreSQL
docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c "SELECT version();"
```

**Cette correction doit être appliquée immédiatement pour résoudre l'erreur 500 lors de la création des configurations NocoDB.**