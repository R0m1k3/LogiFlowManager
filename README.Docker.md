# 🐳 LogiFlow - Déploiement Docker Production

Guide complet pour déployer LogiFlow en production avec Docker.

## 📋 Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+
- Au moins 2GB de RAM disponible
- Ports 80, 443, 5000, et 5432 disponibles

## 🚀 Déploiement Rapide

### 1. Configuration Initiale

```bash
# Cloner le projet (si pas déjà fait)
git clone <votre-repo> logiflow
cd logiflow

# Copier le fichier d'environnement
cp .env.example .env

# Modifier les variables de production
nano .env
```

### 2. Variables d'Environnement Importantes

Modifiez ces variables dans `.env` :

```bash
# ⚠️ OBLIGATOIRE: Changez ces valeurs pour la production
POSTGRES_PASSWORD=votre_mot_de_passe_securise_123
SESSION_SECRET=votre_cle_secrete_session_super_longue_et_aleatoire

# Configuration base de données
DATABASE_URL=postgresql://logiflow_user:${POSTGRES_PASSWORD}@postgres:5432/logiflow

# Configuration application
NODE_ENV=production
USE_LOCAL_AUTH=true
```

### 3. Déploiement Automatique

```bash
# Lancer le script de déploiement
./scripts/deploy.sh
```

### 4. Déploiement Manuel

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

## 🌐 Accès à l'Application

Une fois déployé, l'application est accessible sur :

- **HTTPS (recommandé)** : https://localhost
- **HTTP** : http://localhost  
- **Direct** : http://localhost:5000

### 🔑 Connexion par Défaut

- **Identifiant** : `admin`
- **Mot de passe** : `admin`

> ⚠️ **IMPORTANT** : Changez le mot de passe admin immédiatement après la première connexion !

## 📊 Architecture Docker

### Services Déployés

1. **logiflow-app** : Application Node.js principale
2. **logiflow-db** : Base de données PostgreSQL 15
3. **logiflow-nginx** : Reverse proxy avec SSL

### Volumes Persistants

- `postgres_data` : Données de la base de données
- `app_uploads` : Fichiers uploadés par l'application

### Réseau

- `logiflow-network` : Réseau privé pour la communication inter-conteneurs

## 🔧 Commandes de Gestion

### Logs et Monitoring

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx

# Status des services
docker-compose ps
```

### Maintenance

```bash
# Redémarrer tous les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart app

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ PERTE DE DONNÉES)
docker-compose down -v
```

### Base de Données

```bash
# Accéder à la base de données
docker-compose exec postgres psql -U logiflow_user -d logiflow

# Sauvegarde de la base de données
docker-compose exec postgres pg_dump -U logiflow_user logiflow > backup.sql

# Restaurer une sauvegarde
docker-compose exec -T postgres psql -U logiflow_user logiflow < backup.sql
```

## 🔒 Sécurité en Production

### 1. Certificats SSL

Le déploiement génère des certificats auto-signés pour le développement. En production :

```bash
# Remplacez les certificats dans le dossier ssl/
cp votre-certificat.pem ssl/cert.pem
cp votre-cle-privee.key ssl/key.pem

# Redémarrer nginx
docker-compose restart nginx
```

### 2. Pare-feu

Configurez votre pare-feu pour n'exposer que les ports nécessaires :

```bash
# Autoriser seulement HTTP/HTTPS
ufw allow 80
ufw allow 443

# Bloquer l'accès direct à l'application et la base de données
# (ils sont accessibles seulement via nginx et le réseau Docker interne)
```

### 3. Mots de Passe

- Changez `POSTGRES_PASSWORD` dans `.env`
- Changez `SESSION_SECRET` dans `.env`
- Changez le mot de passe admin dans l'application

## 📈 Optimisations Production

### 1. Ressources

```yaml
# Ajoutez dans docker-compose.yml pour limiter les ressources
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

### 2. Backup Automatique

Créez un script de sauvegarde automatique :

```bash
#!/bin/bash
# scripts/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U logiflow_user logiflow > "backups/backup_${DATE}.sql"
```

### 3. Monitoring

Ajoutez un service de monitoring :

```yaml
# Dans docker-compose.yml
  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

## 🚨 Dépannage

### Problèmes Courants

1. **Port déjà utilisé**
   ```bash
   # Vérifier les ports utilisés
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

2. **Problème de permissions**
   ```bash
   # Corriger les permissions des volumes
   docker-compose exec app chown -R nextjs:nodejs /app/uploads
   ```

3. **Base de données inaccessible**
   ```bash
   # Vérifier la santé de PostgreSQL
   docker-compose exec postgres pg_isready -U logiflow_user
   ```

4. **Certificats SSL invalides**
   ```bash
   # Régénérer les certificats
   rm ssl/*
   ./scripts/deploy.sh
   ```

### Logs de Debug

```bash
# Activer le mode debug
docker-compose exec app npm run dev

# Voir les logs détaillés
docker-compose logs --tail=100 -f app
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Vérifiez le status : `docker-compose ps`
3. Vérifiez la configuration : `cat .env`
4. Redémarrez les services : `docker-compose restart`

## 🔄 Mise à Jour

Pour mettre à jour l'application :

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redéployer
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```