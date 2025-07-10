# 🚀 Instructions de Déploiement - Correction Base de Données

## Problème Actuel
❌ **Erreur**: `relation "users" does not exist`  
❌ **Cause**: Base de données PostgreSQL sans les tables nécessaires

## Solution Complète

### Étape 1: Arrêter et Nettoyer
```bash
# Sur votre serveur Docker
cd /path/to/logiflow

# Arrêter tous les conteneurs
docker-compose -f docker-compose.production.yml down

# Supprimer l'ancienne image (optionnel)
docker rmi logiflow-app-logiflow-app

# 🔴 IMPORTANT: Supprimer le volume de base de données
docker volume rm logiflow-app_postgres_data
```

### Étape 2: Vérifier les Fichiers
Assurez-vous que ces fichiers sont présents :

**📄 init.sql** (script d'initialisation de la DB)
```sql
-- Le fichier init.sql contient maintenant :
-- ✅ Création des tables users, groups, suppliers, orders, deliveries
-- ✅ Tables de sessions pour express-session  
-- ✅ Données par défaut (magasins et fournisseurs)
-- ✅ Index de performance
```

**📄 docker-compose.production.yml** 
```yaml
# Volume mapping correct :
volumes:
  - ./init.sql:/docker-entrypoint-initdb.d/init.sql
```

### Étape 3: Reconstruction et Démarrage
```bash
# Reconstruire l'image avec corrections
docker-compose -f docker-compose.production.yml build --no-cache

# Démarrer avec nouvelle base vierge
docker-compose -f docker-compose.production.yml up -d

# Attendre l'initialisation (30-60 secondes)
sleep 30
```

### Étape 4: Vérifications
```bash
# 1. Vérifier les services
docker-compose -f docker-compose.production.yml ps

# 2. Vérifier l'initialisation PostgreSQL
docker-compose -f docker-compose.production.yml logs postgres

# 3. Tester l'application
curl http://localhost:5001/api/health

# 4. Vérifier les logs application
docker-compose -f docker-compose.production.yml logs logiflow-app
```

## Résultat Attendu

### ✅ Logs PostgreSQL Corrects
```
postgres | LOG: database system is ready to accept connections
postgres | NOTICE: LogiFlow database schema initialized successfully
postgres | NOTICE: Default admin account will be created by application: admin/admin
```

### ✅ Logs Application Corrects  
```
logiflow-app | Using PostgreSQL connection for production
logiflow-app | Using local authentication system
logiflow-app | Checking for default admin user...
logiflow-app | ✅ Default admin user created: admin/admin
logiflow-app | [express] serving on port 5000
```

### ✅ Health Check
```bash
curl http://localhost:5001/api/health
# {"status":"healthy","timestamp":"...","environment":"production","auth":"local","database":"connected"}
```

## Troubleshooting

### Si l'erreur persiste :
```bash
# Vérifier que le volume est supprimé
docker volume ls | grep postgres

# Entrer dans le conteneur PostgreSQL
docker exec -it logiflow-postgres psql -U logiflow_admin -d logiflow_db

# Vérifier les tables
\dt
```

### Si les tables n'existent pas :
```bash
# Vérifier que init.sql est monté
docker exec -it logiflow-postgres ls -la /docker-entrypoint-initdb.d/

# Recréer le volume complètement
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

## Contact Admin

**Connexion**: `admin` / `admin`  
**URL**: `http://localhost:5001`  
**Base de données**: Port 5434 (externe) → 5432 (interne)

Le mot de passe peut être changé après la première connexion.