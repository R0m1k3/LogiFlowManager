# Guide de Déploiement Production - Correction Authentification

## Situation Actuelle

**Problème en Production :**
- Tous les utilisateurs ont erreur 401 sur les APIs
- Interface des rôles inaccessible 
- Échec de redéploiement de stack (notification visible)

**Environnement Dev :**
- ✅ Fonctionnel après correction
- ✅ Authentification admin/admin OK
- ✅ API /api/default-credentials-check corrigée

## Solution Complète

### 1. Corrections Créées

**Scripts de correction globale :**
- `fix-production-auth-global.sql` - Correction base de données
- `fix-production-auth-global.sh` - Guide détaillé de procédure

**Problèmes corrigés :**
- Sessions expirées/corrompues
- Utilisateurs sans rôles assignés
- Mots de passe admin incorrects
- Structure base de données incohérente

### 2. Procédure de Correction Production

#### Étape 1 : Accès Base de Données
```bash
# Se connecter au container PostgreSQL
docker exec -it logiflow-db psql -U logiflow_admin -d logiflow_db
```

#### Étape 2 : Diagnostic
```sql
-- Vérifier l'état actuel
SELECT COUNT(*) as total_sessions,
       COUNT(CASE WHEN expire > CURRENT_TIMESTAMP THEN 1 END) as active_sessions
FROM sessions;

SELECT id, username, email, role, password_changed FROM users ORDER BY created_at;
```

#### Étape 3 : Correction
```sql
-- Exécuter le script de correction complet
\i fix-production-auth-global.sql
```

#### Étape 4 : Redémarrage
```bash
# Redémarrer l'application
docker-compose restart logiflow-app

# Ou redémarrage complet si nécessaire
docker-compose down && docker-compose up -d
```

### 3. Tests de Validation

#### Test 1 : APIs Fonctionnelles
```bash
# Test health check
curl http://localhost:3000/api/health

# Test login admin
curl -X POST -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}' \
     http://localhost:3000/api/login
```

#### Test 2 : Interface Utilisateur
1. Accéder à l'interface web
2. Se connecter avec admin/admin
3. Vérifier accès à la page /roles
4. Confirmer affichage des 4 rôles colorés

### 4. Utilisateurs de Test

**Utilisateur Principal :**
- Username: `admin`
- Password: `admin`
- Rôle: Administrateur

**Utilisateur Direction :**
- Username: `directionfrouard`
- Password: `admin`
- Rôle: Administrateur

### 5. Résultats Attendus

**APIs Corrigées :**
- GET /api/user → 200 OK (au lieu de 401)
- GET /api/roles → 200 OK avec 4 rôles
- GET /api/permissions → 200 OK avec 42 permissions
- GET /api/default-credentials-check → 200 OK

**Interface Restaurée :**
- Page des rôles entièrement fonctionnelle
- Couleurs et permissions affichées correctement
- Modification des rôles sans erreur 401

### 6. Actions Post-Correction

1. **Vérification Complète :**
   - Tous les modules accessibles
   - Authentification stable
   - Permissions fonctionnelles

2. **Changement Mots de Passe :**
   - Demander aux utilisateurs de changer leurs mots de passe
   - Les mots de passe par défaut sont temporaires

3. **Monitoring :**
   - Surveiller les logs pour détecter d'autres problèmes
   - Vérifier la stabilité des sessions

## Notes Importantes

- **Sauvegarde :** Les corrections préservent toutes les données existantes
- **Sécurité :** Les mots de passe par défaut doivent être changés
- **Performance :** Le redémarrage peut prendre quelques minutes
- **Rollback :** En cas de problème, restaurer depuis la sauvegarde

## Support

Si les corrections ne résolvent pas complètement le problème :

1. Vérifier les logs Docker : `docker-compose logs logiflow-app`
2. Contrôler la base de données : `docker-compose logs logiflow-db`
3. Tester les APIs manuellement avec curl
4. Redémarrage complet si nécessaire

## Succès Confirmé Quand

✅ Login admin/admin fonctionne sans erreur  
✅ Page /roles affiche les 4 rôles avec couleurs  
✅ Toutes les APIs retournent 200 OK au lieu de 401  
✅ Interface complètement fonctionnelle  
✅ Notifications d'échec disparues