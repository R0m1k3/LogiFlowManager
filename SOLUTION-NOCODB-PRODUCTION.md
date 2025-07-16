# Solution NocoDB Production - Erreur 500 lors de la création

## 🔴 Problème identifié

La création de configurations NocoDB échoue en production avec l'erreur PostgreSQL :
```
ERROR: null value in column "table_id" violates not-null constraint
```

**Cause** : La base de données de production contient encore les anciennes colonnes (`table_id`, `table_name`, `invoice_column_name`) avec des contraintes NOT NULL qui ne sont plus utilisées dans l'architecture actuelle.

## 🏗️ Architecture actuelle

### Configuration globale (table `nocodb_config`)
- `id` : Identifiant unique
- `name` : Nom de la configuration
- `base_url` : URL de l'instance NocoDB
- `project_id` : ID du projet NocoDB
- `api_token` : Token d'API personnel
- `description` : Description optionnelle
- `is_active` : Configuration active/inactive
- `created_by` : Utilisateur créateur
- `created_at`, `updated_at` : Timestamps

### Configuration par magasin (table `groups`)
- `nocodb_config_id` : Référence vers la configuration globale
- `nocodb_table_id` : ID de la table spécifique au magasin
- `nocodb_table_name` : Nom de la table
- `invoice_column_name` : Nom de la colonne des factures

## 🔧 Solution immédiate

### 1. Application du script SQL
```bash
# Via Docker (si disponible)
docker exec -i logiflow-postgres psql -U logiflow_admin -d logiflow_db < fix-nocodb-production.sql

# Ou directement
psql -U logiflow_admin -d logiflow_db < fix-nocodb-production.sql
```

### 2. Verification automatique
```bash
./apply-nocodb-fix-production.sh
```

### 3. Redémarrage de l'application (optionnel)
```bash
docker restart logiflow-app
```

## ✅ Vérification du succès

1. **Structure de la table** :
   ```sql
   \d nocodb_config;
   ```
   Doit afficher uniquement : id, name, base_url, project_id, api_token, description, is_active, created_by, created_at, updated_at

2. **Test de création** :
   - Accéder à l'interface d'administration
   - Créer une nouvelle configuration NocoDB
   - Vérifier l'absence d'erreur 500

3. **Logs de l'application** :
   Vérifier qu'il n'y a plus d'erreur de contrainte NOT NULL

## 🚀 Utilisation post-correction

### Créer une configuration globale
1. Aller dans Administration → Configuration NocoDB
2. Créer une nouvelle configuration avec :
   - Nom : "NocoDB Production"
   - URL : "https://nocodb.ffnancy.fr"
   - Projet ID : votre_project_id
   - API Token : votre_api_token

### Configurer un magasin
1. Aller dans Magasins
2. Éditer un magasin
3. Sélectionner la configuration NocoDB
4. Définir l'ID de table et le nom de colonne

## 📋 Points importants

- ✅ **Données préservées** : Les configurations existantes ne sont pas affectées
- ✅ **Compatibilité** : L'architecture hybride fonctionne (config globale + params par magasin)
- ✅ **Évolutivité** : La structure est maintenant alignée avec le schéma Drizzle
- ✅ **Maintenance** : Plus de problèmes de contraintes NOT NULL sur colonnes obsolètes

## 🔄 Prévention future

Le script `initDatabase.production.ts` crée déjà la table avec la bonne structure. Cette erreur ne se reproduira plus sur les nouvelles installations.