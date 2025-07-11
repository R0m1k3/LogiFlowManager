# Déploiement du Système de Gestion des Rôles - LogiFlow

## 🚀 Nouvelles Fonctionnalités Déployées

### Système de Gestion des Rôles Dynamique
- **Création de rôles personnalisés** avec permissions granulaires
- **Gestion des permissions** par catégorie (Dashboard, Calendrier, Commandes, etc.)
- **Interface utilisateur complète** pour configurer les rôles
- **Protection des rôles système** (admin, manager, employee)
- **Assignation flexible** des permissions aux rôles

### Permissions Calendrier Complètes
- **Lecture** : Voir les événements du calendrier
- **Création** : Ajouter nouvelles commandes/livraisons
- **Modification** : Éditer les événements existants
- **Suppression** : Supprimer les événements
- **Validation** : Valider les livraisons

### Interface Utilisateur Améliorée
- **Mise en évidence date actuelle** dans le calendrier avec fond bleu subtil
- **Affichage publicités amélioré** avec indication des magasins participants
- **Cartes modernes** avec ombres élégantes et bordures fines
- **Badges colorés** pour identifier les participations par magasin

## 📋 Procédure de Déploiement

### 1. Préparation
```bash
# Cloner ou mettre à jour le dépôt
git pull origin main

# Vérifier les fichiers de production
ls -la docker-compose.yml
ls -la init.sql
```

### 2. Déploiement Automatique
```bash
# Exécuter le script de mise à jour
./update-production-roles.sh
```

### 3. Déploiement Manuel (si nécessaire)
```bash
# Arrêter les conteneurs
docker-compose down

# Supprimer les anciennes images
docker-compose down --rmi all --volumes --remove-orphans

# Reconstruction
docker-compose build --no-cache
docker-compose up -d

# Vérifier l'état
docker-compose ps
```

## 🔧 Nouvelles Tables de Base de Données

Les tables suivantes sont créées automatiquement :

### Table `roles`
- `id` : Identifiant unique
- `name` : Nom du rôle
- `description` : Description du rôle
- `is_system` : Booléen indiquant si c'est un rôle système
- `created_at`, `updated_at` : Timestamps

### Table `permissions`
- `id` : Identifiant unique
- `name` : Nom de la permission
- `description` : Description de la permission
- `category` : Catégorie (Dashboard, Calendar, etc.)
- `created_at` : Timestamp

### Table `role_permissions`
- `role_id` : Référence vers le rôle
- `permission_id` : Référence vers la permission
- Clé primaire composite (role_id, permission_id)

## 🛠️ Configuration Initiale

### Rôles par Défaut
Créés automatiquement au démarrage :

1. **Admin** (système)
   - Toutes les permissions
   - Gestion des utilisateurs et rôles
   - Accès complet

2. **Manager** (système)
   - Permissions de gestion
   - Pas d'accès à la gestion des utilisateurs
   - Accès multi-magasins

3. **Employee** (système)
   - Permissions de base
   - Accès restreint aux magasins assignés
   - Pas de suppression

### Permissions par Catégorie
- **Dashboard** : read
- **Calendar** : read, create, update, delete
- **Orders** : read, create, update, delete
- **Deliveries** : read, create, update, delete, validate
- **Users** : read, create, update, delete
- **Magasins** : read, create, update, delete
- **Suppliers** : read, create, update, delete
- **Publicities** : read, create, update, delete
- **Reconciliation** : read, create, update, delete

## 🔐 Accès et Authentification

### Connexion Administrateur
- **URL** : `http://localhost:3000`
- **Username** : `admin`
- **Password** : `admin`

### Première Utilisation
1. Connectez-vous avec admin/admin
2. Allez dans "Gestion des Rôles" (nouveau menu)
3. Créez vos rôles personnalisés
4. Configurez les permissions selon vos besoins
5. Assignez les rôles aux utilisateurs

## 📊 Nouvelles API Endpoints

### Rôles
- `GET /api/roles` - Liste des rôles
- `POST /api/roles` - Créer un rôle
- `PUT /api/roles/:id` - Modifier un rôle
- `DELETE /api/roles/:id` - Supprimer un rôle

### Permissions
- `GET /api/permissions` - Liste des permissions
- `POST /api/permissions` - Créer une permission

### Gestion des Permissions de Rôle
- `GET /api/roles/:roleId/permissions` - Permissions d'un rôle
- `POST /api/roles/:roleId/permissions` - Assigner permissions à un rôle

## 🔍 Vérifications Post-Déploiement

### 1. Vérification des Conteneurs
```bash
docker-compose ps
# Doit afficher app et postgres comme "Up"
```

### 2. Vérification API
```bash
# Test API de base
curl http://localhost:3000/api/debug/status

# Test API rôles (nécessite authentification)
curl -X GET http://localhost:3000/api/roles -H "Cookie: connect.sid=YOUR_SESSION"
```

### 3. Vérification Base de Données
```bash
# Connexion à la base
docker-compose exec postgres psql -U logiflow_admin -d logiflow_db

# Vérifier les tables
\dt
# Doit afficher roles, permissions, role_permissions

# Vérifier les données
SELECT * FROM roles;
SELECT * FROM permissions;
```

### 4. Vérification Interface
1. Accédez à `http://localhost:3000`
2. Connectez-vous avec admin/admin
3. Vérifiez le menu "Gestion des Rôles"
4. Testez la création d'un rôle personnalisé
5. Vérifiez l'affichage des publicités avec magasins participants

## 🚨 Résolution de Problèmes

### Erreur "Table does not exist"
```bash
# Recréer la base de données
docker-compose down
docker volume rm $(docker volume ls -q | grep postgres)
docker-compose up -d
```

### Erreur API Routes
```bash
# Vérifier les logs
docker-compose logs app -f

# Redémarrer l'application
docker-compose restart app
```

### Problèmes de Permissions
- Vérifiez que l'utilisateur connecté a le rôle admin
- Contrôlez les logs pour les erreurs d'authentification
- Videz le cache du navigateur

## 📈 Surveillance et Maintenance

### Logs Application
```bash
# Logs en temps réel
docker-compose logs app -f

# Logs d'erreur seulement
docker-compose logs app | grep ERROR
```

### Métriques
- **URL** : `http://localhost:3000/api/metrics`
- Surveillance des performances
- Détection des requêtes lentes

### Sauvegarde
```bash
# Sauvegarde de la base
docker-compose exec postgres pg_dump -U logiflow_admin -d logiflow_db > backup.sql

# Restauration
docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db < backup.sql
```

## ✅ Checklist de Déploiement

- [ ] Script de mise à jour exécuté avec succès
- [ ] Conteneurs démarrés (app + postgres)
- [ ] API accessible (`/api/debug/status`)
- [ ] Base de données connectée (`/api/debug/db`)
- [ ] Interface web accessible
- [ ] Connexion admin/admin fonctionnelle
- [ ] Menu "Gestion des Rôles" visible
- [ ] Création de rôle personnalisé testée
- [ ] Permissions configurables
- [ ] Affichage publicités amélioré
- [ ] Calendrier avec date actuelle mise en évidence
- [ ] Logs sans erreurs critiques

## 🎯 Prochaines Étapes

1. **Configurez vos rôles** selon vos besoins organisationnels
2. **Assignez les permissions** appropriées à chaque rôle
3. **Créez des utilisateurs** avec les nouveaux rôles
4. **Testez les permissions** dans chaque module
5. **Documentez vos rôles** personnalisés pour votre équipe

---

**Déploiement réalisé le** : 11 juillet 2025
**Version** : Système de gestion des rôles complet
**Status** : Prêt pour la production