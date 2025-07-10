# 🚀 Solution Complète 502 Bad Gateway - Docker Production

## 🔧 Corrections Appliquées

### 1. Session Store PostgreSQL
- ✅ Remplacement de MemoryStore par PostgreSQL session store
- ✅ Ajout de connect-pg-simple pour sessions persistantes

### 2. Logs Détaillés
- ✅ Logging complet des requêtes entrantes
- ✅ Tracking des headers et IPs
- ✅ Identification unique des requêtes

### 3. Routes de Debug
- ✅ `/api/debug/status` - État complet du serveur
- ✅ `/api/debug/echo` - Test de connectivité
- ✅ `/api/debug/db` - Test connexion PostgreSQL

## 📋 Étapes de Déploiement

### 1. Rebuild Complet
```bash
# Arrêter les conteneurs
docker stop logiflow-app logiflow-postgres
docker rm logiflow-app logiflow-postgres

# Supprimer l'ancien volume (IMPORTANT)
docker volume rm logiflow_postgres_data

# Rebuild avec les corrections
docker-compose -f docker-compose.production.yml build --no-cache

# Démarrer
docker-compose -f docker-compose.production.yml up -d
```

### 2. Attendre l'Initialisation
```bash
# Attendre 30 secondes
sleep 30

# Vérifier les logs détaillés
docker logs -f logiflow-app
```

### 3. Tester l'Accès Direct
```bash
# Test API health
curl http://localhost:8080/api/health

# Test debug status
curl http://localhost:8080/api/debug/status

# Test connexion DB
curl http://localhost:8080/api/debug/db
```

### 4. Vérifier OpenResty/Nginx
Si vous utilisez OpenResty, vérifiez sa configuration :
```bash
# Trouver la config
find /etc -name "*.conf" | grep -E "(nginx|openresty)" | xargs grep -l "5001\|5000"

# Modifier proxy_pass vers 8080
# proxy_pass http://localhost:8080;
```

## 🔍 Diagnostic avec les Nouveaux Logs

Après redéploiement, les logs afficheront :
```
[abc123] --> GET /api/health
[abc123]     Host: localhost:8080
[abc123]     IP: 172.20.0.1
[abc123]     Headers: {"x-forwarded-for":null,"x-real-ip":null}
[abc123] <-- GET /api/health 200 in 5ms :: {"status":"healthy"...}
```

## ✅ Points de Vérification

1. **Session PostgreSQL** : Plus de warning MemoryStore
2. **Logs détaillés** : Chaque requête tracée avec ID unique
3. **Routes de debug** : Accès aux infos système en temps réel
4. **Health check** : Validation que l'app répond

## 🎯 Résolution 502

Si l'erreur 502 persiste après ces étapes :

1. **Vérifier les logs Docker** :
```bash
docker logs logiflow-app --tail 100
```

2. **Tester depuis le conteneur** :
```bash
docker exec logiflow-app curl http://localhost:5000/api/health
```

3. **Vérifier le réseau Docker** :
```bash
docker network inspect bridge
docker port logiflow-app
```

4. **Utiliser les routes de debug** :
- http://VOTRE_IP:8080/api/debug/status
- http://VOTRE_IP:8080/api/debug/echo
- http://VOTRE_IP:8080/api/debug/db

## 🚀 Commande Rapide

```bash
# Script complet de redéploiement
docker-compose -f docker-compose.production.yml down -v && \
docker-compose -f docker-compose.production.yml build --no-cache && \
docker-compose -f docker-compose.production.yml up -d && \
sleep 30 && \
curl http://localhost:8080/api/health
```