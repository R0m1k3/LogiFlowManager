# 🚀 DÉPLOIEMENT FINAL - Application LogiFlow Docker Production

## 📋 Configuration Finalisée

### ✅ Architecture Production
- **Application** : Docker avec Node.js + Express sur port 8080
- **Base de données** : PostgreSQL dans conteneur séparé (port 5434)
- **Session** : MemoryStore (compatible production courte)
- **Authentification** : Locale (admin/admin)
- **Réseau** : Bridge Docker personnalisé

### ✅ Ports Configurés
- **8080** : Application LogiFlow (accessible depuis l'extérieur)
- **5434** : PostgreSQL (pour administration)
- **5000** : Port interne application (dans le conteneur)

## 🛠️ Commandes de Déploiement

### 1. Préparation Complète
```bash
# Aller dans le répertoire du projet
cd /path/to/logiflow

# Nettoyer complètement
docker-compose -f docker-compose.production.yml down -v
docker system prune -f
docker volume prune -f

# Rebuild avec cache vide
docker-compose -f docker-compose.production.yml build --no-cache

# Démarrer en arrière-plan
docker-compose -f docker-compose.production.yml up -d
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
curl -s http://localhost:8080/api/health | jq .

# Test des routes debug
curl -s http://localhost:8080/api/debug/status | jq .
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

## 🌐 Configuration Nginx/OpenResty

### Configuration pour Reverse Proxy

Créez ou modifiez votre configuration nginx :

```nginx
# /etc/nginx/sites-available/logiflow
# ou dans votre configuration OpenResty existante

upstream logiflow_backend {
    server localhost:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name votre-domaine.com;  # Remplacez par votre domaine

    # Redirection vers HTTPS (optionnel)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://logiflow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffers
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Gestion des erreurs
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}

# Configuration HTTPS (si certificat SSL)
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    # Même configuration proxy qu'au-dessus
    location / {
        proxy_pass http://logiflow_backend;
        # ... (même configuration)
    }
}
```

### Activation de la Configuration
```bash
# Si nouveau fichier de site
ln -s /etc/nginx/sites-available/logiflow /etc/nginx/sites-enabled/

# Test de la configuration
nginx -t

# Redémarrage
systemctl reload nginx
# ou pour OpenResty
systemctl reload openresty
```

## 📊 Monitoring et Maintenance

### Commandes de Surveillance
```bash
# État des conteneurs
docker stats logiflow-app logiflow-postgres

# Utilisation des volumes
docker system df

# Santé de l'application
watch -n 5 'curl -s http://localhost:8080/api/health | jq .'
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

### Si erreur 502 depuis nginx
```bash
# Vérifier que l'app répond
curl http://localhost:8080/api/health

# Vérifier la config nginx
nginx -t

# Logs nginx
tail -f /var/log/nginx/error.log

# Redémarrer nginx
systemctl restart nginx
```

### Si problème de base de données
```bash
# Vérifier PostgreSQL
docker exec logiflow-postgres pg_isready -U logiflow_admin

# Se connecter à la DB
docker exec -it logiflow-postgres psql -U logiflow_admin -d logiflow_db

# Recréer les tables si besoin
docker exec logiflow-app curl http://localhost:5000/api/debug/db
```

## ✅ Validation Finale

L'application est correctement déployée quand :

1. **Conteneurs actifs** : `docker ps` montre les 2 conteneurs running
2. **API accessible** : `curl http://localhost:8080/api/health` retourne du JSON
3. **Base de données** : `curl http://localhost:8080/api/debug/db` montre connected: true
4. **Interface web** : Accessible via nginx sur votre domaine
5. **Authentification** : Login admin/admin fonctionne

## 🎯 Accès à l'Application

- **Direct** : http://172.20.0.14:8080
- **Via nginx** : http://votre-domaine.com (après config nginx)
- **Admin** : Connexion avec admin/admin

## 📝 Notes Importantes

- Le warning MemoryStore est normal pour cette configuration
- Les sessions sont perdues au redémarrage (normal avec MemoryStore)
- PostgreSQL conserve toutes les données utilisateurs
- L'application se connecte automatiquement à la DB au démarrage
- Les logs détaillés permettent un debug facile en production