# 🚨 CORRECTION URGENTE - ERREURS 500 EN PRODUCTION

## Problèmes détectés

L'application génère des erreurs 500 car des colonnes manquent dans la base de données :
- ❌ `column o.notes does not exist` 
- ❌ `column scheduled_date does not exist`

## Solution rapide

### Étape 1 : Connectez-vous au serveur
```bash
ssh [votre-serveur-production]
```

### Étape 2 : Appliquez la correction SQL
```bash
# Option A : Si vous avez copié le fichier emergency-fix-production.sql
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < emergency-fix-production.sql

# Option B : Exécution directe
docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db
```

### Étape 3 : Si option B, collez ce SQL :
```sql
-- Ajouter la colonne notes à orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ajouter la colonne scheduled_date à deliveries  
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date TEXT;

-- Si planned_date existe, copier les données
UPDATE deliveries SET scheduled_date = planned_date WHERE scheduled_date IS NULL AND planned_date IS NOT NULL;
```

### Étape 4 : Redémarrez l'application
```bash
docker restart logiflow-app
```

## Vérification

Après le redémarrage, testez :
- Création d'une commande ✅
- Création d'une livraison ✅
- Affichage de la liste ✅

L'application devrait fonctionner normalement !