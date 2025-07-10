# 🚀 Déploiement Rapide - Correction WebSocket

## Problème Résolu
❌ **Avant**: Erreur WebSocket `wss://postgres/v2` (connexion Neon)  
✅ **Après**: PostgreSQL standard `postgresql://logiflow_admin:LogiFlow2025!@postgres:5432/logiflow_db`

## Solution Appliquée

### 1. Architecture de Production Séparée
- `server/index.production.ts` → Serveur sans dépendances dev
- `server/routes.production.ts` → Routes avec storage PostgreSQL 
- `server/storage.production.ts` → Interface base de données PostgreSQL
- `server/localAuth.production.ts` → Authentification locale pure
- `server/db.production.ts` → Connexion PostgreSQL standard

### 2. Build Dockerfile Optimisé
```dockerfile
# Exclusions explicites des dépendances problématiques
--external:@neondatabase/serverless \
--external:ws \
--external:drizzle-orm/neon-serverless
```

### 3. Variables d'Environnement
```yaml
DATABASE_URL: postgresql://logiflow_admin:LogiFlow2025!@postgres:5432/logiflow_db
NODE_ENV: production
USE_LOCAL_AUTH: "true"
```

## Déploiement Immédiat

### Option 1: Script Automatique
```bash
./deploy-fix.sh
```

### Option 2: Manuel
```bash
# Arrêter et reconstruire
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Vérifier
curl http://localhost:5001/api/health
```

### Option 3: Portainer
1. Copier le contenu de `portainer-stack.yml`
2. Créer une nouvelle stack dans Portainer
3. Deploy

## Vérification du Succès

✅ **Health checks** HTTP 200  
✅ **Pas d'erreurs WebSocket** dans les logs  
✅ **Application accessible** sur port 5001  
✅ **Base PostgreSQL** connectée sur port 5434  
✅ **Admin par défaut**: admin/admin  

## Logs à Surveiller
```bash
# Logs application
docker-compose -f docker-compose.production.yml logs -f logiflow-app

# Logs PostgreSQL
docker-compose -f docker-compose.production.yml logs -f postgres
```

## Troubleshooting

### Si WebSocket persiste
1. Vérifier que `NODE_ENV=production`
2. Rebuilder avec `--no-cache`
3. Supprimer l'ancienne image: `docker rmi logiflow-app-logiflow-app`

### Si base de données inaccessible
1. Vérifier PostgreSQL: `docker-compose -f docker-compose.production.yml logs postgres`
2. Tester connexion: `docker exec -it logiflow-postgres psql -U logiflow_admin -d logiflow_db`

## Support

- Configuration PostgreSQL: `logiflow_admin` / `LogiFlow2025!` / `logiflow_db`
- Port externe: 5434 → Port interne: 5432
- Réseau Docker: `nginx_default`