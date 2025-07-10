# LogiFlow - Gestion Commandes & Livraisons

Application complète de gestion logistique avec interface moderne, authentification simplifiée et déploiement Docker production-ready.

## 🚀 Démarrage Rapide

### Développement Local

```bash
# Cloner le projet
git clone <votre-repo>
cd logiflow

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer en développement
npm run dev
```

### Déploiement Production (Docker)

```bash
# Déploiement automatique
./scripts/deploy.sh

# Ou déploiement manuel
docker-compose up -d
```

## 🔑 Authentification

**Identifiants par défaut :**
- **Identifiant** : `admin`
- **Mot de passe** : `admin`

> ⚠️ **Important** : Changez le mot de passe admin immédiatement après la première connexion !

## 📋 Fonctionnalités Complètes

### ✅ Système d'Authentification
- 🔐 Connexion par identifiant/mot de passe
- 👤 Compte admin par défaut automatique
- 🔄 Changement de mot de passe sécurisé
- 🛡️ Sessions persistantes PostgreSQL

### ✅ Gestion des Utilisateurs
- 👥 Création, modification, suppression complète
- 🏷️ Système de rôles : Admin, Manager, Employé
- 🏪 Assignation multi-magasins
- ✏️ Édition de tous les champs utilisateur

### ✅ Multi-Magasins
- 🏬 Gestion de plusieurs points de vente
- 🎨 Codes couleur par magasin
- 👁️ Vue admin "Tous les magasins" ou filtrée
- 🔒 Accès restreint par rôle

### ✅ Gestion des Commandes
- 📦 Planification des commandes fournisseurs
- 📅 Calendrier interactif avec indicateurs visuels
- 🔗 Liaison commandes ↔ livraisons
- 📊 Statuts automatiques (planifié/en attente)

### ✅ Gestion des Livraisons
- 🚚 Suivi complet du cycle de livraison
- ✅ Validation avec capture BL/facture
- 📋 Gestion des quantités et unités
- 🧾 Rapprochement BL/factures automatisé

### ✅ Interface Moderne
- 🎨 Design moderne avec bordures fines et ombres
- 🔄 Modales arrondies (rounded-2xl)
- 📱 Interface responsive et intuitive
- 🌈 Système de couleurs cohérent

### ✅ Rapprochement Comptable
- 📋 Module BL/Factures dédié
- 💰 Calcul automatique des différences
- ✅ Validation des rapprochements
- 📊 Filtrage par date de validation

## 🏗️ Architecture Technique

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **TanStack Query** pour la gestion d'état
- **Wouter** pour le routage léger
- **Date-fns** avec locale française

### Backend
- **Node.js** + Express.js
- **PostgreSQL** + Drizzle ORM  
- **Sessions PostgreSQL** (connect-pg-simple)
- **API RESTful** avec validation Zod
- **Authentification locale** avec bcrypt

### Déploiement
- **Docker** multi-stage optimisé
- **PostgreSQL 15** containerisé
- **Health checks** et monitoring
- **Utilisateur non-root** pour la sécurité
- **Réseau externe** nginx_default

## 🐳 Configuration Docker Production

### Services Déployés
- **logiflow-app** : Application Node.js (port 5000)
- **logiflow-db** : PostgreSQL 15 (port 5434)

### Identifiants Base de Données
- **Host** : localhost:5434
- **Database** : logiflow_db
- **User** : logiflow_admin
- **Password** : LogiFlow2025!

### Réseau
- **nginx_default** : Réseau externe (créé automatiquement)

### Volumes Persistants
- `postgres_data` : Données de la base
- `app_uploads` : Fichiers uploadés

## 🔧 Scripts et Commandes

### Développement
```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm start           # Démarrage production
```

### Base de Données
```bash
npm run db:push     # Appliquer le schéma
npm run db:studio   # Interface admin DB
```

### Docker
```bash
./scripts/deploy.sh    # Déploiement automatique
./scripts/backup.sh    # Sauvegarde base de données
docker-compose logs -f # Logs en temps réel
```

## 👥 Système de Rôles

### 🔴 Administrateur
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs et permissions
- Vue globale ou filtrée par magasin
- Création et suppression d'éléments

### 🔵 Manager  
- Gestion des fournisseurs et groupes
- Accès à plusieurs magasins assignés
- Création de commandes et livraisons
- Pas d'accès à la gestion utilisateur

### 🟢 Employé
- Accès limité aux magasins assignés
- Vue et création dans son périmètre
- Pas de gestion administrative
- Interface simplifiée

## 🔒 Sécurité Production

### Authentification
- Sessions sécurisées PostgreSQL
- Hachage bcrypt des mots de passe
- Validation automatique des tokens
- Déconnexion automatique en cas d'erreur

### Docker
- Utilisateur non-root (nodejs:nextjs)
- Health checks automatiques
- Volumes persistants sécurisés
- Réseau isolé nginx_default

### API
- Validation Zod sur toutes les entrées
- Contrôle d'accès basé sur les rôles
- Logs détaillés des actions
- Protection contre les injections

## 📁 Structure du Projet

```
logiflow/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants UI
│   │   ├── pages/         # Pages application
│   │   ├── hooks/         # Hooks personnalisés
│   │   └── lib/           # Utilitaires
├── server/                # Backend Express
│   ├── routes.ts          # Routes API
│   ├── storage.ts         # Accès données
│   ├── localAuth.ts       # Authentification
│   └── db.ts             # Configuration DB
├── shared/                # Types partagés
│   └── schema.ts         # Schémas Drizzle
├── scripts/              # Scripts déploiement
│   ├── deploy.sh         # Déploiement auto
│   └── backup.sh         # Sauvegarde DB
├── docker-compose.yml    # Configuration Docker
├── Dockerfile           # Image application
└── README.Docker.md     # Guide Docker détaillé
```

## 📊 Données et Migration

### Schéma Base de Données
- **users** : Utilisateurs et authentification
- **groups** : Magasins/points de vente
- **user_groups** : Relations utilisateur-magasin
- **suppliers** : Fournisseurs
- **orders** : Commandes fournisseurs
- **deliveries** : Livraisons et BL
- **session** : Sessions utilisateur

### Migration
- Auto-migration Drizzle au démarrage
- Création automatique compte admin
- Indexes optimisés pour les performances
- Extensions PostgreSQL (uuid-ossp, pgcrypto)

## 🚀 Déploiement Rapide

### Option 1 : Script Automatique
```bash
# Télécharger et déployer
git clone <repo> && cd logiflow
./scripts/deploy.sh
```

### Option 2 : Manuel
```bash
# Créer le réseau si nécessaire
docker network create nginx_default

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### Accès Application
- **URL** : http://localhost:5001
- **Login** : admin / admin
- **Base de données** : localhost:5434

## 🚀 Déploiement Production via Portainer

LogiFlow supporte le déploiement automatisé via GitHub Container Registry et Portainer :

### Configuration Rapide

1. **Fork le repository** sur votre compte GitHub
2. **Modifier l'image** dans `portainer-stack.yml` :
   ```yaml
   image: ghcr.io/VOTRE_USERNAME/VOTRE_REPO:latest
   ```
3. **Créer une stack** dans Portainer avec le contenu de `portainer-stack.yml`
4. **Déployer** !

### Mises à Jour Automatiques

- **Push vers GitHub** → Build automatique de l'image
- **Portainer** → Update en un clic ou via Watchtower
- **Script de mise à jour** : `./scripts/update-from-github.sh`

📖 **Guide complet** : [DEPLOYMENT-PORTAINER.md](DEPLOYMENT-PORTAINER.md)

## 📞 Support et Maintenance

### Monitoring
```bash
# Logs application
docker-compose logs -f app

# Logs base de données  
docker-compose logs -f postgres

# Status services
docker-compose ps
```

### Sauvegarde
```bash
# Sauvegarde manuelle
./scripts/backup.sh

# Sauvegarde programmée (crontab)
0 2 * * * /path/to/logiflow/scripts/backup.sh
```

### Mise à Jour
```bash
# Récupérer les modifications
git pull

# Redéployer
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🎯 Points Clés

- ✅ **Production-ready** avec Docker optimisé
- ✅ **Authentification simplifiée** par identifiant
- ✅ **Interface moderne** avec design cohérent  
- ✅ **Multi-magasins** avec permissions granulaires
- ✅ **Rapprochement comptable** automatisé
- ✅ **Déploiement simplifié** avec scripts automatiques
- ✅ **Documentation complète** et troubleshooting

---

**LogiFlow** - Solution complète de gestion logistique moderne pour environnements multi-magasins