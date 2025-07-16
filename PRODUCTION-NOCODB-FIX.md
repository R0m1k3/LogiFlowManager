# Correction NocoDB Production - Urgente

## Problème identifié
La table `nocodb_config` en production contient encore les anciennes colonnes (`table_id`, `table_name`, `invoice_column_name`) avec des contraintes NOT NULL, causant l'erreur 500 lors de la création.

## Solution immédiate

### Option 1: Script SQL direct (Recommandé)
Exécuter directement dans la base PostgreSQL de production :

```sql
-- Suppression des colonnes obsolètes
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;  
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;

-- Vérification de la structure finale
\d nocodb_config;
```

### Option 2: Via Docker exec
```bash
docker exec logiflow-postgres psql -U logiflow_admin -d logiflow_db -c "
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_id;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS table_name;
ALTER TABLE nocodb_config DROP COLUMN IF EXISTS invoice_column_name;
"
```

### Option 3: Script automatisé
```bash
./apply-nocodb-fix-production.sh
```

## Après correction

1. **Redémarrer l'application** (si nécessaire)
2. **Tester la création** d'une configuration NocoDB
3. **Vérifier** que les paramètres par magasin restent dans la table `groups`

## Architecture finale
- ✅ **Configuration globale** : `nocodb_config` (URL, projet, token)
- ✅ **Configuration par magasin** : `groups.nocodb_table_id`, `groups.nocodb_table_name`, `groups.invoice_column_name`

## Test de validation
Après correction, cette création devrait fonctionner :
- Nom : "Nocodb"
- URL : "https://nocodb.ffnancy.fr"
- Projet : "admin"
- Token : "[votre-token]"