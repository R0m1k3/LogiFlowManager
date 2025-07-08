# LogiFlow - Gestion Commandes & Livraisons

Application web complète pour la gestion des commandes et livraisons multi-magasins avec système de permissions basé sur les rôles.

## Fonctionnalités

- **Authentification flexible** : Support Replit Auth et authentification locale
- **Gestion multi-magasins** : Filtrage des données par magasin
- **Système de rôles** : Admin, Manager, Employé
- **Calendrier intégré** : Visualisation des commandes et livraisons
- **Interface moderne** : Built avec React, TypeScript et Tailwind CSS

## Démarrage rapide

### Mode développement (avec Replit Auth)
```bash
npm install
npm run dev
```

### Mode Docker (authentification locale)
```bash
docker-compose up --build
```

L'application sera disponible sur `http://localhost:5000`

**Compte admin par défaut (mode Docker) :**
- Email: `admin@logiflow.com`
- Mot de passe: `admin123`

## Architecture

### Technologies utilisées
- **Frontend** : React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend** : Node.js, Express, PostgreSQL
- **ORM** : Drizzle ORM
- **Authentification** : Replit Auth / Passport.js (local)
- **Build** : Vite

### Structure du projet
```
├── client/          # Application React
├── server/          # API Express
├── shared/          # Schémas partagés
├── Dockerfile       # Configuration Docker
└── docker-compose.yml
```

## Variables d'environnement

### Mode développement
- `DATABASE_URL` : URL de connexion PostgreSQL
- `SESSION_SECRET` : Clé secrète pour les sessions
- `REPLIT_DOMAINS` : Domaines Replit autorisés

### Mode Docker
- `USE_LOCAL_AUTH=true` : Active l'authentification locale
- `DATABASE_URL` : Configuré automatiquement
- `SESSION_SECRET` : Clé secrète pour les sessions

## Commandes utiles

```bash
# Développement
npm run dev              # Démarre le serveur de développement
npm run build           # Build pour la production
npm run db:push         # Met à jour le schéma de base de données

# Docker
docker-compose up --build    # Démarre avec Docker
docker-compose down          # Arrête les services
docker-compose logs app      # Affiche les logs
```

## Système d'authentification

### Replit Auth (développement)
- Utilise les comptes Replit existants
- Connexion via OpenID Connect
- Gestion automatique des utilisateurs

### Local Auth (production/Docker)
- Comptes locaux avec email/mot de passe
- Sessions PostgreSQL
- Inscription libre ou création d'utilisateurs par admin

## Permissions et rôles

### Administrateur
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs et assignations
- Vue globale sur tous les magasins

### Manager
- Gestion des fournisseurs et groupes
- Accès aux magasins assignés
- Création de commandes et livraisons

### Employé
- Consultation des données
- Création de commandes dans ses magasins
- Accès limité aux fonctionnalités

## Déploiement

### Avec Docker
1. Cloner le repository
2. Configurer les variables d'environnement
3. Exécuter `docker-compose up --build`

### Manuel
1. Build l'application : `npm run build`
2. Configurer PostgreSQL
3. Démarrer : `node dist/server/index.js`

## Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## Support

Pour toute question ou problème, veuillez créer une issue sur le repository.