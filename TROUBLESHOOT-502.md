# 🔧 Résolution Erreur 502 - LogiFlow Production

## ✅ Status Application Backend
L'application LogiFlow fonctionne parfaitement :
- Base de données initialisée
- Compte admin créé (admin/admin)
- Health checks HTTP 200
- Port interne 5000 opérationnel

## ❌ Erreur 502 Bad Gateway
Cette erreur indique un problème de reverse proxy, pas de l'application.

## 🔍 Diagnostic

### 1. Vérifier les conteneurs
```bash
docker-compose -f docker-compose.production.yml ps
```
**Attendu :** Conteneurs `logiflow-app` et `postgres` en status `Up`

### 2. Tester l'application directement
```bash
# Test health check
curl http://localhost:5001/api/health

# Test page principale
curl -I http://localhost:5001
```
**Attendu :** HTTP 200 responses

### 3. Vérifier les logs application
```bash
docker-compose -f docker-compose.production.yml logs logiflow-app
```
**Attendu :** "[express] serving on port 5000"

## 🛠️ Solutions par Contexte

### Si vous utilisez nginx externe
Vérifier la configuration nginx :
```nginx
location / {
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Si vous utilisez un load balancer
Vérifier que la target pointe vers :
- **IP** : localhost ou IP du serveur
- **Port** : 5001 (pas 5000)
- **Protocol** : HTTP (pas HTTPS sur le backend)

### Si vous utilisez Portainer/Docker Swarm
Vérifier que le service est dans le bon réseau :
```yaml
networks:
  - nginx_default  # Si vous utilisez un réseau externe
```

## 🔧 Corrections Rapides

### 1. Redémarrer complètement
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### 2. Vérifier les ports
```bash
# Vérifier que le port 5001 est utilisé
netstat -tlnp | grep 5001

# Ou avec ss
ss -tlnp | grep 5001
```

### 3. Test sans reverse proxy
Si vous avez un reverse proxy, testez directement :
```bash
curl http://IP_SERVEUR:5001/api/health
```

## 🎯 Configuration Docker Recommandée

Pour éliminer les problèmes de proxy, assurez-vous que le port mapping est correct dans docker-compose.production.yml :

```yaml
logiflow-app:
  ports:
    - "5001:5000"  # Port externe:interne
```

## 📞 Support

Si l'erreur 502 persiste :
1. L'application LogiFlow est opérationnelle
2. Le problème est dans votre infrastructure réseau
3. Vérifiez votre configuration nginx/reverse proxy
4. Testez l'accès direct au port 5001