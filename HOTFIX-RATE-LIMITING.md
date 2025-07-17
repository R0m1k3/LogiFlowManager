# 🚨 HOTFIX - Accès aux logs de debug en production

## Système de debug activé

✅ **Logs détaillés ajoutés** dans `server/routes.production.ts` pour :
- Route POST /api/groups 
- Route POST /api/suppliers

## Comment voir les logs en production

### 1. Via Docker logs
```bash
# Logs en temps réel
docker logs -f logiflow-app

# Logs des dernières 100 lignes
docker logs --tail 100 logiflow-app

# Logs avec timestamp
docker logs -t logiflow-app
```

### 2. Via Portainer (si utilisé)
1. Aller dans Containers > logiflow-app
2. Cliquer sur "Logs"
3. Activer "Auto-refresh" pour voir en temps réel

### 3. Logs à surveiller

Quand vous créez un groupe, vous devriez voir :
```
🏪 POST /api/groups - Raw request received
📨 Request headers: {"content-type":"application/json",...}
📋 Request body type: object
📋 Request body content: {"name":"Test","color":"#FF5722"}
📋 Request body keys: ["name","color"]
🔐 User requesting group creation: admin_local
✅ User has permission to create group: admin
✅ Group data validation passed: {...}
🏪 Creating group with data: {...}
✅ Group created successfully: {...}
```

**OU en cas d'erreur :**
```
❌ Error creating group: [détails de l'erreur]
📊 Full error details: {...}
```

## Test immédiat

1. **Ouvrir les logs** : `docker logs -f logiflow-app`
2. **Dans l'interface** : Aller sur Groupes/Magasins > Créer un nouveau groupe
3. **Remplir** : Nom="Test Debug", Couleur="#FF5722"
4. **Valider** et observer les logs en temps réel

Les logs vont révéler exactement où le problème se situe :
- Problème de parsing du body (express.json)
- Problème de validation Zod  
- Problème de base de données PostgreSQL
- Problème d'authentification/permissions

## Résolution attendue

Une fois les logs visibles, nous pourrons identifier et corriger immédiatement le problème exact.