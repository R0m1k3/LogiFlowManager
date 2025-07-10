# LogiFlow - Gestion Commandes & Livraisons

Application web de gestion logistique pour La Foir'Fouille avec système de calendrier intégré et gestion multi-magasins.

## 🚀 Déploiement Production

### Déploiement Rapide
```bash
./deploy-fix.sh
```

### Déploiement Manuel
```bash
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 📋 Accès Application

- **URL** : http://votre-serveur:8080
- **Admin** : admin/admin
- **Base de données** : PostgreSQL sur port 5434
- **Réseau** : nginx_default (externe)

## 🔧 Configuration Nginx

Copiez `nginx-logiflow.conf` dans votre configuration nginx et modifiez :
```nginx
upstream logiflow_backend {
    server localhost:8080;
}
```

## 📚 Documentation

- **DEPLOY-FINAL.md** : Guide complet de déploiement
- **deploy-fix.sh** : Script automatique de déploiement
- **nginx-logiflow.conf** : Configuration nginx
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