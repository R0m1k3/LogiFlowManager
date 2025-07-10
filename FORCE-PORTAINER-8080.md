# 🔧 Forcer Portainer à Utiliser Port 8080

## 🎯 Problème
Portainer garde `5001:5000` malgré la mise à jour

## ⚡ Solution Forcée - Suppression Complète

### 1. Supprimer complètement le stack/container
```bash
# Dans Portainer ou en ligne de commande
docker stop logiflow-app logiflow-postgres
docker rm logiflow-app logiflow-postgres
docker volume prune -f
```

### 2. Créer un nouveau stack avec port 8080

Dans Portainer → Stacks → Add Stack :

**Nom du stack :** `logiflow-8080`

**Configuration :**
```yaml
version: '3.8'

services:
  logiflow-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    
    container_name: logiflow-app-8080
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://logiflow_admin:LogiFlow2025!@postgres:5432/logiflow_db
      SESSION_SECRET: LogiFlow_Super_Secret_Session_Key_2025_Production
      PORT: 5000
      USE_LOCAL_AUTH: "true"
      NODE_ENV: production
    ports:
      - "8080:5000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: logiflow-postgres-8080
    restart: unless-stopped
    environment:
      POSTGRES_DB: logiflow_db
      POSTGRES_USER: logiflow_admin
      POSTGRES_PASSWORD: LogiFlow2025!
    ports:
      - "5434:5432"
    volumes:
      - postgres_data_8080:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U logiflow_admin -d logiflow_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data_8080:
    driver: local
```

### 3. Alternative - Commande Docker Run Directe

Si Portainer pose toujours problème :
```bash
# Arrêter tout
docker stop $(docker ps -aq) 2>/dev/null || true

# Démarrer PostgreSQL
docker run -d \
  --name logiflow-postgres-new \
  --restart unless-stopped \
  -e POSTGRES_DB=logiflow_db \
  -e POSTGRES_USER=logiflow_admin \
  -e POSTGRES_PASSWORD=LogiFlow2025! \
  -p 5434:5432 \
  -v postgres_data_new:/var/lib/postgresql/data \
  postgres:15-alpine

# Attendre que PostgreSQL démarre
sleep 10

# Démarrer l'application LogiFlow
docker run -d \
  --name logiflow-app-new \
  --restart unless-stopped \
  --link logiflow-postgres-new:postgres \
  -e DATABASE_URL=postgresql://logiflow_admin:LogiFlow2025!@logiflow-postgres-new:5432/logiflow_db \
  -e SESSION_SECRET=LogiFlow_Super_Secret_Session_Key_2025_Production \
  -e PORT=5000 \
  -e USE_LOCAL_AUTH=true \
  -e NODE_ENV=production \
  -p 8080:5000 \
  votre-image-logiflow:latest
```

## ✅ Vérification

Après déploiement :
```bash
curl http://localhost:8080/api/health
```

## 🎯 Résultat Final

- **Port affiché dans Portainer :** `8080:5000`
- **URL d'accès :** `http://VOTRE_IP:8080`
- **Application fonctionnelle**