# 🔧 Résolution Erreur 502 Bad Gateway - OpenResty

## 🎯 Problème
OpenResty (reverse proxy) ne peut pas atteindre l'application LogiFlow

## 📋 Diagnostic

L'erreur 502 signifie que :
- OpenResty fonctionne
- Mais ne peut pas communiquer avec LogiFlow
- Probablement configuré pour l'ancien port 5001

## ✅ Solution 1 - Accès Direct (Recommandé)

**Contournez complètement OpenResty :**
```
http://VOTRE_IP_SERVEUR:8080
```

Ne pas utiliser l'URL avec OpenResty, accéder directement au port 8080.

## 🔧 Solution 2 - Corriger OpenResty

Si vous devez garder OpenResty, trouvez sa configuration :

### 1. Localiser la config OpenResty
```bash
# Généralement dans :
/etc/nginx/conf.d/
/etc/openresty/conf.d/
/usr/local/openresty/nginx/conf/
```

### 2. Modifier le proxy_pass
Cherchez votre configuration de site et changez :
```nginx
# Ancien
proxy_pass http://localhost:5001;

# Nouveau
proxy_pass http://localhost:8080;
```

### 3. Recharger OpenResty
```bash
# Tester la configuration
nginx -t

# Recharger
nginx -s reload
# ou
systemctl reload openresty
```

## 🚀 Solution 3 - Configuration OpenResty Complète

Créer `/etc/nginx/conf.d/logiflow.conf` :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## ✅ Vérification

### 1. Tester l'accès direct
```bash
curl http://localhost:8080/api/health
```

### 2. Vérifier que l'app écoute
```bash
netstat -tlnp | grep 8080
# ou
ss -tlnp | grep 8080
```

### 3. Vérifier les logs Docker
```bash
docker logs logiflow-app
```

## 🎯 Recommandation

Puisque vous voulez un accès simplifié sans reverse proxy :
1. **Utilisez directement** : `http://VOTRE_IP:8080`
2. **Désactivez OpenResty** si non nécessaire
3. **Ou corrigez** la configuration pour pointer vers 8080