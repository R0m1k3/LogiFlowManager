# 🚀 CORRECTION DOCKER PRODUCTION

## Problème actuel
L'application Docker ne démarre pas à cause de l'erreur :
```
Error: Dynamic require of "connect-pg-simple" is not supported
```

## Solutions appliquées dans le code
✅ Remplacé `require('connect-pg-simple')` par `import connectPgSimple from "connect-pg-simple"`  
✅ Corrigé la structure `UserWithGroups[]` pour la page Utilisateurs  
✅ Sessions PostgreSQL configurées correctement  

## Instructions pour votre serveur Docker

### 1. Récupérez le code corrigé
```bash
# Sur votre serveur, dans le dossier de l'application
git pull origin main
# OU téléchargez les fichiers corrigés depuis Replit
```

### 2. Reconstruisez l'image Docker complètement
```bash
# Arrêter les conteneurs
docker-compose down

# Nettoyer complètement les images (IMPORTANT)
docker system prune -af --volumes

# Reconstruire sans cache pour forcer les nouvelles corrections
docker-compose build --no-cache --pull

# Redémarrer
docker-compose up -d
```

### 3. Vérifiez le démarrage
```bash
# Voir les logs de démarrage
docker-compose logs -f logiflow-app

# Vérifier l'état des conteneurs
docker-compose ps

# Tester l'API
curl http://localhost:3000/api/health
```

### 4. Test de connexion
Une fois l'application redémarrée :
- Accédez à http://localhost:3000
- Connectez-vous avec : **admin / admin**
- La page Utilisateurs devrait maintenant s'afficher correctement

## Fichiers modifiés à récupérer
- `server/localAuth.production.ts` (corrigé import ES6)
- `server/storage.production.ts` (corrigé UserWithGroups[])
- `update-production.sh` (script automatisé)

## Si vous avez des problèmes
Envoyez-moi les logs avec :
```bash
docker-compose logs --tail=50 logiflow-app
```

---

**🎯 Résultat attendu :** Après reconstruction, l'authentification admin/admin fonctionnera et la page Utilisateurs affichera les 2 utilisateurs existants dans la base.