# 🚨 Solution 502 Bad Gateway - OpenResty Configuration

## 🔍 Problème Identifié

OpenResty reçoit une erreur 502 en essayant de se connecter à l'application LogiFlow.

### État Actuel
- ✅ Application fonctionne (port 5000 interne)
- ✅ API Health répond 200
- ✅ Docker expose port 8080 externe
- ❌ OpenResty ne peut pas se connecter

## 🛠️ Solutions

### 1. Rebuild et Redéployer l'Application

```bash
# Arrêter et supprimer les conteneurs
docker-compose -f docker-compose.production.yml down

# Rebuild avec les corrections
docker-compose -f docker-compose.production.yml build --no-cache

# Démarrer
docker-compose -f docker-compose.production.yml up -d
```

### 2. Vérifier la Configuration OpenResty

Trouvez et vérifiez votre configuration OpenResty :

```bash
# Trouver les fichiers de config
find /etc -name "*.conf" 2>/dev/null | xargs grep -l "proxy_pass"

# Ou spécifiquement pour OpenResty
ls /etc/openresty/sites-enabled/
ls /usr/local/openresty/nginx/conf/
```

### 3. Configuration OpenResty Correcte

Votre configuration OpenResty doit pointer vers `http://localhost:8080` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:8080;
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
    }
}
```

### 4. Test Direct de l'Application

Après redéploiement, testez :

```bash
# Test depuis l'hôte
curl http://localhost:8080/api/health
curl http://localhost:8080/api/debug/status

# Vérifier les logs avec tracking détaillé
docker logs -f logiflow-app --tail 50
```

### 5. Debug avec les Nouvelles Routes

Les nouvelles routes de debug vous donneront des informations précieuses :

- **http://localhost:8080/api/debug/status** - État complet du serveur
- **http://localhost:8080/api/debug/echo** - Test de connectivité
- **http://localhost:8080/api/debug/db** - Test base de données

### 6. Vérifier le Réseau Docker

```bash
# Vérifier que le conteneur écoute bien
docker exec logiflow-app netstat -tlnp | grep 5000

# Vérifier le mapping des ports
docker port logiflow-app

# Inspecter le réseau
docker inspect logiflow-app | grep -A 10 "NetworkMode"
```

## 📋 Script de Diagnostic Complet

```bash
#!/bin/bash
echo "🔍 Diagnostic 502 Error..."

# 1. Rebuild
echo "1. Rebuilding containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# 2. Attendre le démarrage
echo "2. Waiting for startup..."
sleep 30

# 3. Test direct
echo "3. Testing direct access..."
curl -s http://localhost:8080/api/health | jq .

# 4. Debug info
echo "4. Getting debug info..."
curl -s http://localhost:8080/api/debug/status | jq .

# 5. Logs
echo "5. Application logs:"
docker logs logiflow-app --tail 20

# 6. Test depuis le conteneur
echo "6. Testing from inside container..."
docker exec logiflow-app curl -s http://localhost:5000/api/health
```

## 🎯 Résolution Rapide

Si OpenResty continue à donner 502 :

1. **Accès Direct** - Utilisez directement `http://VOTRE_IP:8080` sans OpenResty
2. **Modifier OpenResty** - Changez `proxy_pass` vers `http://localhost:8080`
3. **Redémarrer OpenResty** :
   ```bash
   systemctl restart openresty
   # ou
   nginx -s reload
   ```

## ✅ Validation

L'application fonctionne correctement quand :
- `curl http://localhost:8080/api/health` retourne `{"status":"healthy"}`
- Les logs montrent les requêtes avec IDs uniques
- Pas d'erreur "Dynamic require" dans les logs

## 📝 Note Importante

Les logs détaillés afficheront maintenant :
```
[abc123] --> GET /api/health
[abc123]     Host: localhost:8080
[abc123]     IP: 172.20.0.1
[abc123]     Headers: {"x-forwarded-for":null,"x-real-ip":null}
[abc123] <-- GET /api/health 200 in 5ms
```

Cela vous aidera à identifier d'où viennent les requêtes et diagnostiquer les problèmes.