# LogiFlow - Gestion Commandes & Livraisons

## 🚀 Vue d'ensemble

LogiFlow est une application web complète de gestion logistique pour les commandes et livraisons multi-magasins. Elle inclut un calendrier interactif, un système de réconciliation BL/Factures, la gestion des publicités, et un module de commandes clients.

## ✨ Fonctionnalités

### 📊 Dashboard
- Statistiques mensuelles en temps réel
- Vue d'ensemble du calendrier
- Indicateurs de performance

### 📅 Calendrier
- Vue mensuelle interactive
- Création rapide de commandes/livraisons
- Codes couleur par statut

### 📦 Gestion des Commandes
- CRUD complet des commandes fournisseurs
- Statuts : en attente, planifiée, livrée
- Liaison avec les livraisons

### 🚚 Gestion des Livraisons
- Planification et validation
- Saisie BL et quantités
- Suivi des statuts

### 💰 Rapprochement BL/Factures
- Réconciliation automatique
- Vérification NocoDB
- Calcul des écarts

### 👥 Gestion des Utilisateurs
- Authentification locale
- Système de rôles dynamique
- Assignation aux magasins

### 🏪 Gestion des Magasins
- Configuration des groupes
- Couleurs et identifiants
- Intégration NocoDB

### 📈 Module Publicités
- Campagnes publicitaires
- Participation des magasins
- Planification annuelle

### 🛒 Commandes Clients
- Gestion des commandes clients
- Statuts de traitement
- Système de notifications

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build
- **TailwindCSS** pour le style
- **Shadcn/ui** pour les composants
- **TanStack Query** pour la gestion d'état

### Backend
- **Node.js** avec Express
- **PostgreSQL** avec Drizzle ORM
- **Authentification locale** avec sessions
- **Rate limiting** et sécurité

### Déploiement
- **Docker** avec multi-stage build
- **PostgreSQL** containerisé
- **Health checks** automatiques
- **Scripts de déploiement** automatisés

## 📋 Prérequis

- Docker et Docker Compose
- 2 GB de RAM minimum
- 5 GB d'espace disque
- Réseau nginx_default (créé automatiquement)

## 🚀 Installation et Déploiement

### 1. Cloner le projet
```bash
git clone <repository-url>
cd logiflow
```

### 2. Configuration
Les variables d'environnement sont préconfigurées dans `docker-compose.yml` :
- Base de données : PostgreSQL sur port 5434
- Application : Port 3000
- Authentification : admin / admin

### 3. Déploiement automatique
```bash
./deploy-production.sh
```

### 4. Déploiement manuel
```bash
# Construire et démarrer
docker-compose build
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### 5. Accès à l'application
- URL : http://localhost:3000
- Identifiants : admin / admin

## 🔧 Configuration

### Base de données
- **Host** : localhost:5434
- **Database** : logiflow_db
- **User** : logiflow_admin
- **Password** : LogiFlow2025!

### Sécurité
- Sessions stockées en PostgreSQL
- Rate limiting activé
- Headers de sécurité configurés
- Validation des entrées

## 📊 Modules Disponibles

### Dashboard
- Statistiques mensuelles
- Prochaines livraisons
- Publicités à venir

### Calendrier
- Navigation mensuelle
- Création rapide
- Filtres par magasin

### Commandes
- Liste complète
- Création/modification
- Statuts automatiques

### Livraisons
- Planification
- Validation avec BL
- Calcul quantités

### Rapprochement
- Réconciliation BL/Factures
- Vérification NocoDB
- Gestion des écarts

### Utilisateurs
- Création/modification
- Assignation magasins
- Gestion des rôles

### Magasins
- Configuration complète
- Couleurs et codes
- Intégration NocoDB

### Publicités
- Campagnes annuelles
- Participation magasins
- Vue calendrier

### Commandes Clients
- Prise de commande
- Suivi statuts
- Notifications

## 🔐 Rôles et Permissions

### Admin
- Accès complet à tous les modules
- Gestion des utilisateurs
- Configuration système

### Manager
- Gestion multi-magasins
- Accès aux rapports
- Permissions étendues

### Employee
- Accès aux magasins assignés
- Création/modification limitée
- Consultation des données

## 🗄️ Structure de la Base

### Tables principales
- `users` : Utilisateurs et authentification
- `groups` : Magasins et configuration
- `suppliers` : Fournisseurs
- `orders` : Commandes fournisseurs
- `deliveries` : Livraisons et BL
- `customer_orders` : Commandes clients
- `publicities` : Campagnes publicitaires
- `roles` : Rôles système
- `permissions` : Permissions disponibles

## 📝 Logs et Monitoring

### Logs applicatifs
```bash
docker-compose logs -f logiflow-app
```

### Logs base de données
```bash
docker-compose logs -f postgres
```

### Health checks
- Application : http://localhost:3000/api/health
- Monitoring automatique toutes les 30 secondes

## 🔄 Maintenance

### Mise à jour
```bash
# Arrêter les services
docker-compose down

# Reconstruire
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

### Sauvegarde
```bash
# Sauvegarde base de données
docker-compose exec postgres pg_dump -U logiflow_admin logiflow_db > backup.sql

# Restauration
docker-compose exec -T postgres psql -U logiflow_admin logiflow_db < backup.sql
```

### Nettoyage
```bash
# Supprimer les volumes (attention : perte de données)
docker-compose down -v

# Nettoyer les images
docker system prune -a
```

## 📞 Support

### Logs utiles
- Erreurs applicatives dans les logs Docker
- Statut des services avec `docker-compose ps`
- Health checks automatiques

### Configuration NocoDB
- URL : https://nocodb.ffnancy.fr
- Configuration par magasin
- Vérification automatique des factures

## 🎯 Statut du Projet

**✅ PRODUCTION READY**

- Toutes les fonctionnalités implémentées
- Tests de déploiement réussis
- Documentation complète
- Scripts automatisés
- Sécurité renforcée
- Performance optimisée

L'application est prête pour un déploiement en production immédiat.