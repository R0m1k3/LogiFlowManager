# 🚨 SOLUTION DÉFINITIVE 502 Bad Gateway

## 🔍 Problème Identifié

L'application LogiFlow fonctionne correctement dans le conteneur Docker, mais OpenResty (reverse proxy) ne peut pas s'y connecter à l'adresse `http://172.20.0.14:8080`.

## 📋 Diagnostic Réseau

### 1. Vérifier le Conteneur Docker
```bash
# Vérifier que le conteneur est bien démarré
docker ps | grep logiflow

# Vérifier les ports exposés
docker port logiflow-app

# Tester depuis l'hôte Docker
curl http://localhost:8080/api/health
```

### 2. Problèmes Possibles

**A. Conteneur pas démarré correctement**
```bash
# Redémarrer complètement
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Vérifier les logs
docker logs logiflow-app
```

**B. Port 8080 pas exposé**
```bash
# Dans docker-compose.production.yml, vérifier :
ports:
  - "8080:5000"
```

**C. Configuration OpenResty incorrecte**

## 🛠️ Solutions par Ordre de Priorité

### Solution 1: Vérifier et Corriger docker-compose.production.yml

Le fichier doit contenir :
```yaml
version: '3.8'
services:
  logiflow-app:
    build: .
    container_name: logiflow-app
    ports:
      - "8080:5000"  # ESSENTIEL : Port externe 8080 → Port interne 5000
    environment:
      - NODE_ENV=production
      - USE_LOCAL_AUTH=true
      - DATABASE_URL=postgresql://logiflow_admin:LogiFlow2025!@logiflow-postgres:5432/logiflow_db
      - PORT=5000
    depends_on:
      - logiflow-postgres
    restart: unless-stopped
```

### Solution 2: Configuration OpenResty

Trouvez le fichier de configuration OpenResty et modifiez-le :

```bash
# Trouver la configuration
find /etc -name "*.conf" 2>/dev/null | xargs grep -l "proxy_pass"
```

**Configuration correcte :**
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;  # Pointer vers le port Docker exposé
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts augmentés
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Solution 3: Script de Diagnostic et Réparation

```bash
#!/bin/bash
echo "🔧 RÉPARATION 502 LOGIFLOW"

# 1. Arrêter et nettoyer
echo "1. Nettoyage..."
docker-compose -f docker-compose.production.yml down -v

# 2. Rebuild complet
echo "2. Rebuild..."
docker-compose -f docker-compose.production.yml build --no-cache

# 3. Démarrer
echo "3. Démarrage..."
docker-compose -f docker-compose.production.yml up -d

# 4. Attendre initialisation
echo "4. Attente initialisation (30s)..."
sleep 30

# 5. Test application
echo "5. Test application..."
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ Application accessible sur port 8080"
else
    echo "❌ Application non accessible sur port 8080"
    echo "Vérification des ports Docker..."
    docker port logiflow-app
fi

# 6. Test depuis conteneur
echo "6. Test depuis conteneur..."
docker exec logiflow-app curl -s http://localhost:5000/api/health > /dev/null && echo "✅ App OK dans conteneur" || echo "❌ App KO dans conteneur"

# 7. Redémarrer OpenResty
echo "7. Redémarrage OpenResty..."
systemctl restart openresty 2>/dev/null || service openresty restart 2>/dev/null || echo "Redémarrez OpenResty manuellement"

echo "🎯 Test final : http://172.20.0.14"
```

## 🎯 Actions Immédiates

### 1. Commandes Rapides
```bash
# Sur le serveur de production
cd /path/to/logiflow

# Redémarrage complet
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Attendre 30 secondes puis tester
sleep 30
curl http://localhost:8080/api/health
```

### 2. Si Port 8080 Non Accessible
```bash
# Vérifier les services en écoute
ss -tlnp | grep :8080
netstat -tlnp | grep :8080

# Vérifier iptables/firewall
iptables -L | grep 8080
ufw status | grep 8080
```

### 3. Configuration Alternative (Port Différent)

Si le port 8080 est déjà utilisé, modifiez :

**docker-compose.production.yml :**
```yaml
ports:
  - "8081:5000"  # Utiliser 8081 au lieu de 8080
```

**Configuration OpenResty :**
```nginx
proxy_pass http://localhost:8081;
```

## ✅ Validation

L'application fonctionne quand :
1. `curl http://localhost:8080/api/health` retourne du JSON
2. `docker logs logiflow-app` montre "serving on port 5000"
3. `docker port logiflow-app` affiche "5000/tcp -> 0.0.0.0:8080"
4. OpenResty redirige correctement vers l'application

## 🚨 Si Rien Ne Fonctionne

**Option de secours : Accès direct**
1. Modifiez temporairement le port dans docker-compose :
```yaml
ports:
  - "80:5000"  # Accès direct sans OpenResty
```

2. Arrêtez OpenResty temporairement :
```bash
systemctl stop openresty
```

3. Redémarrez LogiFlow :
```bash
docker-compose -f docker-compose.production.yml up -d
```

4. Testez : `http://172.20.0.14` (port 80 direct)

## 📞 Support Debug

Si vous avez besoin d'aide, fournissez :
```bash
# Informations de diagnostic
docker ps
docker port logiflow-app
docker logs logiflow-app --tail 20
ss -tlnp | grep :8080
curl -v http://localhost:8080/api/health
```