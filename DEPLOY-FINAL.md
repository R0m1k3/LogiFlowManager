# 🚀 DÉPLOIEMENT FINAL - Application LogiFlow Docker Production

## 📋 Configuration Finalisée

### ✅ Architecture Production
- **Application** : Docker avec Node.js + Express sur port 8080
- **Base de données** : PostgreSQL dans conteneur séparé (port 5434)
- **Session** : MemoryStore (compatible production courte)
- **Authentification** : Locale (admin/admin)
- **Réseau** : nginx_default (réseau externe)

### ✅ Ports Configurés
- **3000** : Application LogiFlow (accessible depuis l'extérieur)
- **5434** : PostgreSQL (pour administration)
- **3000** : Port interne application (dans le conteneur)

## 🛠️ Commandes de Déploiement

### 1. Préparation Complète
```bash
# Aller dans le répertoire du projet
cd /path/to/logiflow

# Nettoyer complètement
docker-compose down -v
docker system prune -f
docker volume prune -f

# Rebuild avec cache vide
docker-compose build --no-cache

# Démarrer en arrière-plan
docker-compose up -d
```

### 2. Vérification du Déploiement
```bash
# Attendre l'initialisation complète
echo "⏳ Attente initialisation (45 secondes)..."
sleep 45

# Vérifier les conteneurs
docker ps | grep logiflow

# Vérifier les ports
docker port logiflow-app

# Test de l'API
curl -s http://localhost:3000/api/health | jq .

# Test des routes debug
curl -s http://localhost:3000/api/debug/status | jq .
```

### 3. Logs de Diagnostic
```bash
# Logs application
docker logs logiflow-app --tail 50

# Logs PostgreSQL
docker logs logiflow-postgres --tail 20

# Suivre les logs en temps réel
docker-compose -f docker-compose.production.yml logs -f
```

## 🌐 Accès Direct (Pas de Reverse Proxy)

L'application est accessible **directement** sur le port 3000 :

```bash
# URL d'accès direct
http://votre-serveur:3000

# Test de connectivité
curl http://votre-serveur:3000/api/health
```

### Avantages de l'Accès Direct
- **Plus simple** : Pas de configuration nginx
- **Moins de complexité** : Une seule couche réseau
- **Debug facile** : Logs directement dans l'application
- **Performance** : Pas de proxy intermédiaire

## 📊 Monitoring et Maintenance

### Commandes de Surveillance
```bash
# État des conteneurs
docker stats logiflow-app logiflow-postgres

# Utilisation des volumes
docker system df

# Santé de l'application
watch -n 5 'curl -s http://localhost:3000/api/health | jq .'
```

### Sauvegarde Base de Données
```bash
# Backup
docker exec logiflow-postgres pg_dump -U logiflow_admin logiflow_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i logiflow-postgres psql -U logiflow_admin logiflow_db < backup_20250710.sql
```

## 🔧 Résolution de Problèmes

### Si l'application ne démarre pas
```bash
# Vérifier les logs
docker logs logiflow-app

# Redémarrer seulement l'app
docker-compose -f docker-compose.production.yml restart logiflow-app

# Reconstruire si nécessaire
docker-compose -f docker-compose.production.yml build --no-cache logiflow-app
```

### Si problème d'accès depuis l'extérieur
```bash
# Vérifier que l'app répond localement
curl http://localhost:3000/api/health

# Vérifier le firewall (si nécessaire)
ufw allow 3000
# ou
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

# Vérifier les ports Docker
docker port logiflow-app
```

### Si problème de base de données
```bash
# Vérifier PostgreSQL
docker exec logiflow-postgres pg_isready -U logiflow_admin

# Se connecter à la DB
docker exec -it logiflow-postgres psql -U logiflow_admin -d logiflow_db

# Recréer les tables si besoin
docker exec logiflow-app curl http://localhost:3000/api/debug/db
```

## ✅ Validation Finale

L'application est correctement déployée quand :

1. **Conteneurs actifs** : `docker ps` montre les 2 conteneurs running
2. **API accessible** : `curl http://localhost:3000/api/health` retourne du JSON
3. **Base de données** : `curl http://localhost:3000/api/debug/db` montre connected: true
4. **Interface web** : Accessible directement sur http://serveur:3000
5. **Authentification** : Login admin/admin fonctionne

## 🎯 Accès à l'Application

- **Direct** : http://172.20.0.14:3000
- **Accès direct** : http://votre-serveur:3000
- **Admin** : Connexion avec admin/admin

## 📝 Notes Importantes

- Le warning MemoryStore est normal pour cette configuration
- Les sessions sont perdues au redémarrage (normal avec MemoryStore)
- PostgreSQL conserve toutes les données utilisateurs
- L'application se connecte automatiquement à la DB au démarrage
- Les logs détaillés permettent un debug facile en production