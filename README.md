# LogiFlow - Gestion Logistique Complète

Application de gestion logistique moderne avec authentification locale, système de rôles dynamique et interface optimisée pour tablettes.

## Fonctionnalités Principales

### 🔐 Authentification & Gestion des Utilisateurs
- **Connexion locale** : admin/admin (par défaut)
- **Système de rôles dynamique** : Admin, Manager, Employee
- **Gestion complète des utilisateurs** : Création, modification, suppression
- **Permissions configurables** : Système de permissions par module

### 📦 Gestion des Commandes & Livraisons
- **Commandes fournisseurs** : Création, suivi et validation
- **Livraisons** : Planification et suivi des livraisons
- **Rapprochement BL/Factures** : Réconciliation automatique avec vérification NocoDB
- **Statuts intelligents** : Workflow automatique des statuts

### 🛒 Commandes Clients
- **Interface tactile** : Optimisée pour tablettes
- **Filtrage avancé** : Par fournisseur et statut
- **Notifications client** : Système de notification intégré
- **Impression d'étiquettes** : Génération automatique

### 📊 Tableau de Bord & Calendrier
- **Statistiques temps réel** : Commandes, livraisons, publicités
- **Calendrier interactif** : Vue mensuelle avec navigation
- **Indicateurs visuels** : Codes couleur par statut et magasin

### 📢 Gestion des Publicités
- **Campagnes publicitaires** : Planning annuel
- **Participation des magasins** : Gestion multi-magasins
- **Vues multiples** : Liste, calendrier, vue d'ensemble

## Démarrage Rapide

### Développement Local

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

### Déploiement Docker

```bash
# Construction et démarrage
docker-compose up -d

# Vérification des logs
docker-compose logs -f logiflow

# Arrêt
docker-compose down
```

L'application sera accessible sur `http://localhost:3000`

## Configuration

### Base de Données PostgreSQL
- **Initialisation automatique** : Création des tables au démarrage
- **Données par défaut** : Utilisateur admin créé automatiquement
- **Sessions persistantes** : Stockage des sessions utilisateur

### Authentification
- **Utilisateur par défaut** : admin / admin
- **Changement de mot de passe** : Requis au premier login
- **Rôles configurables** : Système de permissions dynamique

### Intégration NocoDB
- **Vérification automatique** : Références factures
- **Configuration flexible** : Paramètres d'API configurables
- **Réconciliation temps réel** : Validation des montants

## Architecture

### Frontend (React TypeScript)
- **Vite** : Build tool moderne
- **TanStack Query** : Gestion d'état serveur
- **Tailwind CSS** : Styling avec design system
- **Radix UI** : Components accessibles

### Backend (Express.js)
- **TypeScript** : Développement type-safe
- **Drizzle ORM** : Base de données type-safe
- **Sessions PostgreSQL** : Authentification persistante
- **Monitoring intégré** : Performance et erreurs

### Sécurité
- **Rate limiting** : Protection contre les attaques
- **Headers sécurisés** : CSP, HSTS, etc.
- **Validation des entrées** : Sanitisation automatique
- **Logs sécurisés** : Protection des données sensibles

## Modules Disponibles

| Module | Description | Permissions |
|--------|-------------|-------------|
| Dashboard | Tableau de bord avec statistiques | Tous les rôles |
| Calendrier | Vue mensuelle des activités | Tous les rôles |
| Commandes | Gestion des commandes fournisseurs | Admin, Manager |
| Livraisons | Suivi des livraisons | Admin, Manager |
| Commandes Clients | Interface tactile pour clients | Tous les rôles |
| Rapprochement | BL/Factures réconciliation | Admin, Manager |
| Publicités | Gestion des campagnes | Admin, Manager |
| Utilisateurs | Gestion des comptes | Admin uniquement |
| Rôles | Configuration des permissions | Admin uniquement |

## API Endpoints

### Authentification
- `POST /api/login` - Connexion utilisateur
- `GET /api/user` - Informations utilisateur
- `POST /api/logout` - Déconnexion

### Données Principales
- `GET /api/orders` - Commandes fournisseurs
- `GET /api/deliveries` - Livraisons
- `GET /api/customer-orders` - Commandes clients
- `GET /api/suppliers` - Fournisseurs
- `GET /api/groups` - Magasins/Groupes
- `GET /api/publicities` - Publicités

### Administration
- `GET /api/users` - Utilisateurs
- `GET /api/roles` - Rôles et permissions
- `GET /api/stats` - Statistiques

## Monitoring & Performance

### Surveillance Intégrée
- **Temps de réponse** : Alertes requêtes lentes
- **Utilisation mémoire** : Monitoring système
- **Erreurs** : Tracking automatique
- **Cache intelligent** : Optimisation des performances

### Endpoints de Debug
- `GET /api/metrics` - Métriques système
- `POST /api/metrics/reset` - Reset des compteurs

## Déploiement Production

### Prérequis
- Docker & Docker Compose
- PostgreSQL (inclus dans docker-compose)
- Port 3000 disponible

### Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  logiflow:
    image: logiflow:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
```

### Vérification
```bash
# Test de l'API
curl http://localhost:3000/api/health

# Vérification des logs
docker-compose logs -f logiflow
```

## Support & Maintenance

### Résolution des Problèmes
1. **Erreurs d'authentification** : Vérifiez les credentials admin/admin
2. **Problèmes de base de données** : Redémarrez les services
3. **Erreurs de permissions** : Vérifiez les rôles utilisateur
4. **Performances lentes** : Consultez `/api/metrics`

### Maintenance
- **Sauvegarde** : Base PostgreSQL régulière
- **Monitoring** : Surveillance des logs et métriques
- **Mises à jour** : Redéploiement via Docker

## Développement

### Structure du Projet
```
logiflow/
├── client/src/          # Frontend React
│   ├── components/      # Composants réutilisables
│   ├── pages/          # Pages de l'application
│   └── lib/            # Utilitaires
├── server/             # Backend Express
│   ├── routes.ts       # Routes API
│   ├── storage.ts      # Couche d'accès aux données
│   └── index.ts        # Point d'entrée
├── shared/             # Types partagés
├── init.sql           # Initialisation base de données
└── docker-compose.yml # Configuration Docker
```

### Commandes Utiles
```bash
# Développement
npm run dev

# Build production
npm run build

# Migration base de données
npm run db:push

# Tests
npm run test
```

## Documentation

Pour plus de détails techniques, consultez `replit.md` qui contient :
- Architecture complète du système
- Historique des modifications
- Préférences utilisateur
- Configuration avancée

## Versions

- **Version actuelle** : 2.0.0
- **Date de release** : Juillet 2025
- **Compatibilité** : Node.js 18+, PostgreSQL 13+