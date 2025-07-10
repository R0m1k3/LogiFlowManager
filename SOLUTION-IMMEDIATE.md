# ⚡ SOLUTION IMMÉDIATE 502 - OpenResty

## 🎯 Action Rapide

Exécutez ces commandes sur votre serveur `172.20.0.14` :

```bash
# 1. Redémarrage complet de l'application
cd /path/to/logiflow
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# 2. Attendre le démarrage
sleep 30

# 3. Test direct
curl http://localhost:8080/api/health

# 4. Si ça marche, redémarrer OpenResty
systemctl restart openresty
```

## 🔧 Si Le Port 8080 N'est Pas Accessible

**Vérifiez le mapping des ports dans docker-compose.production.yml :**

```yaml
services:
  logiflow-app:
    ports:
      - "8080:5000"  # ← Cette ligne doit être présente
```

## 📋 Configuration OpenResty

Votre fichier de configuration OpenResty doit contenir :

```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8080;  # Port exposé par Docker
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚨 Solution de Secours

Si rien ne fonctionne, accès direct sans OpenResty :

```bash
# Arrêter OpenResty temporairement
systemctl stop openresty

# Modifier docker-compose.production.yml
# Changer ports vers "80:5000"
# Puis redémarrer
docker-compose -f docker-compose.production.yml up -d
```

## ✅ Test de Validation

```bash
# Ces commandes doivent toutes fonctionner
curl http://localhost:8080/api/health
curl http://localhost:8080/api/debug/status
curl http://172.20.0.14  # Depuis l'extérieur
```