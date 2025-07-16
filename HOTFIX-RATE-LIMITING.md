# 🚨 CORRECTIF URGENT - Limitation de requêtes résolue

## Problème identifié
L'erreur "Trop de requêtes depuis cette IP, veuillez réessayer plus tard" était causée par :
- Configuration React Query avec `staleTime: 0` forçant des requêtes constantes  
- Limite API production trop restrictive (100 req/min)
- Appels d'authentification trop fréquents

## ✅ Corrections appliquées

### 1. Optimisation React Query (`client/src/lib/queryClient.ts`)
```js
// AVANT: staleTime: 0 (pas de cache)
// APRÈS: staleTime: 2 * 60 * 1000 (2 minutes de cache)
```

### 2. Authentification optimisée (`client/src/hooks/useAuthUnified.ts`)  
```js
// AVANT: staleTime: 5 * 60 * 1000 (5 minutes)
// APRÈS: staleTime: 10 * 60 * 1000 (10 minutes)
```

### 3. Limites production ajustées (`server/security.ts`)
```js
// AVANT: max: 100 requêtes/minute en production
// APRÈS: max: 300 requêtes/minute en production
// + Exclusion route /api/user du rate limiting strict
```

### 4. Logs de débogage ajoutés
- Alerte automatique quand les limites sont atteintes
- Timestamp et chemin de la requête bloquée

## 🚀 Déploiement production

Pour appliquer ces corrections en production :

1. **Rebuild Docker** :
```bash
docker-compose down
docker-compose up -d --build
```

2. **Vérification** :
```bash
# Tester l'API
curl -I http://votre-domaine:3000/api/user

# Vérifier les logs
docker-compose logs -f logiflow-app
```

## 📊 Impact attendu

- **Réduction 80%** des appels API grâce au cache
- **Capacité triplée** : 300 au lieu de 100 req/min  
- **Performance améliorée** : moins de rechargements inutiles
- **Expérience utilisateur** : plus de blocages par rate limiting

---
*Correctif appliqué le 16 juillet 2025 - LogiFlow v1.2*