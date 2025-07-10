# LogiFlow - Gestion Commandes & Livraisons

Application web de gestion logistique pour La Foir'Fouille avec système de calendrier intégré et gestion multi-magasins.

## 🚀 Déploiement Production

### Déploiement Rapide
```bash
./deploy-fix.sh
```

### Déploiement Manuel
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📋 Accès Application

- **URL** : http://votre-serveur:3000
- **Admin** : admin/admin
- **Base de données** : PostgreSQL sur port 5434
- **Réseau** : nginx_default (externe)

## 🔧 Accès Direct

L'application est accessible directement sur le port 3000 :
- **Pas besoin de nginx ou reverse proxy**
- **Accès direct** : http://votre-serveur:3000

## 📚 Documentation

- **DEPLOY-FINAL.md** : Guide complet de déploiement
- **deploy-fix.sh** : Script automatique de déploiement

- **replit.md** : Architecture et historique du projet

## 🛠️ Développement

```bash
npm install
npm run dev
```

L'application sera accessible sur http://localhost:5000

## 📊 Fonctionnalités

- ✅ Gestion des commandes et livraisons
- ✅ Calendrier interactif mensuel
- ✅ Système multi-magasins
- ✅ Gestion des utilisateurs avec rôles
- ✅ Rapprochement BL/Factures
- ✅ Statistiques et tableau de bord
- ✅ Authentification locale sécurisée