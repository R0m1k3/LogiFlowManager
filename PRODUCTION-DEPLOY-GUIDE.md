# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION COMPLET

## 🔴 PROBLÈME IDENTIFIÉ
La base de données de production est incohérente avec le code :
- Colonne `orders.notes` manquante
- Colonne `deliveries.scheduled_date` au mauvais format (text au lieu de date)
- Colonnes obsolètes (`comments`, `planned_date`) encore présentes

## ✅ SOLUTION COMPLÈTE

### 1. Copier les fichiers sur le serveur
```bash
# Copier les 3 fichiers essentiels
scp fix-production-complete.sql deploy-fix-complete.sh verify-production-schema.sql user@server:/path/to/logiflow/
```

### 2. Exécuter le déploiement automatique
```bash
# Se connecter au serveur
ssh user@server

# Aller dans le dossier du projet
cd /path/to/logiflow/

# Exécuter le script de déploiement
./deploy-fix-complete.sh
```

### 3. Vérifier le résultat
```bash
# Vérifier le schéma
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < verify-production-schema.sql

# Tester l'API
curl http://localhost:3000/api/debug/status
```

## 📋 CE QUE FAIT LE SCRIPT

1. **Arrête l'application** proprement
2. **Sauvegarde la base** (au cas où)
3. **Corrige le schéma** :
   - Ajoute `orders.notes`
   - Convertit `deliveries.scheduled_date` en DATE
   - Ajoute `deliveries.notes`
   - Supprime les colonnes obsolètes
   - Ajoute les colonnes BL/factures
4. **Vérifie les corrections**
5. **Redémarre l'application**
6. **Teste l'API**

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Création de commande
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": 1,
    "groupId": 1,
    "plannedDate": "2025-01-15",
    "status": "pending",
    "notes": "Test après correction",
    "createdBy": "admin"
  }'
```

### Test 2 : Création de livraison
```bash
curl -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": 1,
    "groupId": 1,
    "scheduledDate": "2025-01-15",
    "quantity": 10,
    "unit": "palettes",
    "status": "planned",
    "notes": "Test livraison",
    "createdBy": "admin"
  }'
```

## 🆘 EN CAS DE PROBLÈME

### Restaurer la sauvegarde
```bash
# La sauvegarde est créée automatiquement
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < logiflow_backup_[timestamp].sql
docker restart logiflow-app
```

### Vérifier les logs
```bash
docker logs logiflow-app --tail 100
docker logs logiflow-db --tail 100
```

### Connexion manuelle à la base
```bash
docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db
```

## ✅ RÉSULTAT ATTENDU

Après le déploiement :
- Plus d'erreurs 500
- Création de commandes fonctionnelle
- Création de livraisons fonctionnelle
- Schéma cohérent avec le code TypeScript
- Application 100% opérationnelle

**Le script gère tout automatiquement avec sauvegarde de sécurité !**