# Correction Authentification Production - LogiFlow

## Problème Identifié
L'authentification admin/admin échoue en production car le hash du mot de passe n'est pas correct.

## Solution Immédiate

### 1. Connectez-vous à votre serveur de production et exécutez :

```bash
# 1. Vérifier l'état actuel
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, password_changed FROM users WHERE username = 'admin';"

# 2. Générer un nouveau hash pour 'admin'
NEW_HASH=$(docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log(hashPassword('admin'));
")

echo "Nouveau hash: $NEW_HASH"

# 3. Mettre à jour le hash en base de données
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "UPDATE users SET password = '$NEW_HASH', password_changed = false WHERE username = 'admin';"

# 4. Vérifier la mise à jour
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "SELECT username, password_changed, CASE WHEN LENGTH(password) > 50 THEN 'Hash OK' ELSE 'Problème' END as status FROM users WHERE username = 'admin';"
```

### 2. Testez la connexion

Après avoir exécuté les commandes ci-dessus, testez la connexion avec :
- **Username :** admin
- **Password :** admin

## Alternative : Script de Correction Automatique

Copiez ce script sur votre serveur de production et exécutez-le :

```bash
#!/bin/bash
echo "🔧 Correction Hash Admin - LogiFlow Production"

# Générer nouveau hash
NEW_HASH=$(docker exec logiflow_app node -e "
const crypto = require('crypto');
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
console.log(hashPassword('admin'));
")

# Mettre à jour en base
docker exec logiflow_db psql -U logiflow_admin -d logiflow_db -c "UPDATE users SET password = '$NEW_HASH', password_changed = false WHERE username = 'admin';"

echo "✅ Hash admin mis à jour. Testez avec admin/admin"
```

## Diagnostic Complet

Si le problème persiste, exécutez ce diagnostic :

```bash
# Vérifier l'état des conteneurs
docker ps | grep logiflow

# Vérifier les logs de l'application
docker logs logiflow_app --tail 20

# Tester l'API directement
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Vérifier la santé de l'application
curl http://localhost:3000/api/health
```

## Notes Importantes

- Le hash PBKDF2 est utilisé en production (pas bcrypt)
- Le champ `password_changed` doit être `false` pour afficher les identifiants par défaut
- Assurez-vous que l'application fonctionne avant de tester l'authentification

## Contact

Si le problème persiste après ces étapes, partagez :
1. Les logs de l'application (`docker logs logiflow_app`)
2. Le résultat de la requête SQL sur l'utilisateur admin
3. La réponse de l'API de login