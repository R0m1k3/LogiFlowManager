# 🚀 Déploiement LogiFlow avec Portainer & GitHub

Ce guide explique comment déployer et mettre à jour LogiFlow via Portainer en utilisant GitHub Container Registry.

## 📋 Prérequis

- ✅ Serveur avec Docker et Portainer installés
- ✅ Repository GitHub avec le code LogiFlow
- ✅ GitHub Actions activé sur le repository
- ✅ Réseau Docker `nginx_default` créé

## 🔧 Configuration Initiale

### 1. Préparer le Repository GitHub

1. **Forker ou cloner** ce repository dans votre compte GitHub
2. **Activer GitHub Container Registry** :
   - Aller dans Settings > Packages
   - Activer "Improved container support"

### 2. Configurer l'Image

1. **Modifier les fichiers de configuration** :
   ```bash
   # Dans docker-compose.production.yml et portainer-stack.yml
   # Remplacer :
   image: ghcr.io/username/logiflow:latest
   # Par :
   image: ghcr.io/VOTRE_USERNAME/VOTRE_REPO:latest
   ```

2. **Push vers GitHub** :
   ```bash
   git add .
   git commit -m "Configuration pour déploiement Portainer"
   git push origin main
   ```

### 3. Premier Build Automatique

Après le push, GitHub Actions va automatiquement :
- ✅ Builder l'image Docker
- ✅ La publier sur GitHub Container Registry
- ✅ La taguer comme `latest`

## 🐳 Déploiement avec Portainer

### Option A : Via Stack Portainer (Recommandé)

1. **Connectez-vous à Portainer**
2. **Aller dans Stacks > Add Stack**
3. **Nommer la stack** : `logiflow`
4. **Copier le contenu** de `portainer-stack.yml`
5. **Modifier l'image** : Remplacer `username/logiflow` par votre repository
6. **Deploy the stack**

### Option B : Via Docker Compose

1. **Uploader les fichiers** sur votre serveur :
   ```bash
   scp docker-compose.production.yml user@server:/opt/logiflow/
   scp scripts/update-from-github.sh user@server:/opt/logiflow/
   ```

2. **Créer le réseau** :
   ```bash
   docker network create nginx_default
   ```

3. **Lancer** :
   ```bash
   cd /opt/logiflow
   docker-compose -f docker-compose.production.yml up -d
   ```

## 🔄 Mises à Jour Automatiques

### Méthode 1: Via Portainer Web UI

1. **Aller dans Containers**
2. **Sélectionner le container** `logiflow-app`
3. **Cliquer sur "Recreate"**
4. **Cocher "Pull latest image"**
5. **Confirmer**

### Méthode 2: Via Script Automatique

```bash
# Sur le serveur
./scripts/update-from-github.sh

# Ou pour une version spécifique
./scripts/update-from-github.sh v1.2.0
```

### Méthode 3: Watchtower (Automatique)

Le fichier `portainer-stack.yml` inclut Watchtower qui :
- ✅ Vérifie les nouvelles images toutes les heures
- ✅ Met à jour automatiquement les containers
- ✅ Nettoie les anciennes images

## 🏷️ Gestion des Versions

### Tags Automatiques

GitHub Actions crée automatiquement ces tags :
- `latest` : Dernière version de la branche main
- `main` : Build de la branche main
- `v1.0.0` : Tags Git semver

### Déployer une Version Spécifique

1. **Créer un tag Git** :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Modifier l'image dans Portainer** :
   ```yaml
   image: ghcr.io/username/logiflow:v1.0.0
   ```

## 🔧 Configuration Environnement

### Variables d'Environnement

```yaml
environment:
  DATABASE_URL: postgresql://logiflow_admin:LogiFlow2025!@postgres:5432/logiflow_db
  SESSION_SECRET: LogiFlow_Super_Secret_Session_Key_2025_Production
  PORT: 5000
  USE_LOCAL_AUTH: "true"
```

### Ports

- **Application** : `5001:5000` (externe:interne)
- **Base de données** : `5434:5432` (externe:interne)

## 🔍 Monitoring et Logs

### Via Portainer

1. **Container Logs** : Containers > logiflow-app > Logs
2. **Stats** : Containers > logiflow-app > Stats
3. **Health Checks** : Visible dans l'interface

### Via CLI

```bash
# Logs en temps réel
docker-compose -f docker-compose.production.yml logs -f

# Status des services
docker-compose -f docker-compose.production.yml ps

# Health check manuel
curl http://localhost:5001/api/health
```

## 🛠️ Dépannage

### Problèmes Courants

1. **Image non trouvée** :
   ```bash
   # Vérifier que l'image existe
   docker pull ghcr.io/username/logiflow:latest
   ```

2. **Permissions GitHub** :
   - Vérifier que le repository est public OU
   - Configurer un Personal Access Token

3. **Réseau manquant** :
   ```bash
   docker network create nginx_default
   ```

### Rollback

```bash
# Revenir à une version précédente
docker-compose -f docker-compose.production.yml down
# Modifier l'image dans le fichier vers une version stable
docker-compose -f docker-compose.production.yml up -d
```

## 📞 Support

- **Logs d'application** : `/var/log/logiflow/`
- **Base de données** : Accès via port 5434
- **Health endpoint** : `http://localhost:5001/api/health`

---

## 🎯 Workflow de Mise à Jour Type

1. **Développement** → Push vers GitHub
2. **GitHub Actions** → Build automatique de l'image
3. **Portainer** → Update manual ou automatique via Watchtower
4. **Vérification** → Health checks et logs
5. **Rollback** → Si nécessaire, revenir à une version stable