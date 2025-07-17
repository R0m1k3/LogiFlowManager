# 🚨 CORRECTION PRODUCTION URGENTE - customer_email

## **PROBLÈME IDENTIFIÉ**

L'erreur persiste en production :
```
Error creating customer order: error: column "customer_email" of relation "customer_orders" does not exist
```

**CAUSE** : La colonne `customer_email` n'existe pas dans la table `customer_orders` de votre base PostgreSQL production.

## **SOLUTION IMMÉDIATE**

### **Option 1 : Script Automatique (RECOMMANDÉ)**

```bash
# 1. Aller dans votre répertoire de production
cd /path/to/logiflow

# 2. Exécuter le script de correction
chmod +x apply-customer-orders-fix.sh
./apply-customer-orders-fix.sh
```

### **Option 2 : Commande Manuelle Direct**

```bash
# Exécuter directement la commande SQL
docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db -c "ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);"
```

### **Option 3 : Via Interface PostgreSQL**

Si vous avez accès direct à PostgreSQL :
```sql
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
```

## **VÉRIFICATION POST-CORRECTION**

Après avoir ajouté la colonne, testez :

1. **Vérifier la colonne :**
```bash
docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'customer_orders' AND column_name = 'customer_email';"
```

2. **Redémarrer l'application :**
```bash
docker-compose restart logiflow
```

3. **Tester création commande :**
- Aller dans Commandes Client → Nouvelle Commande
- Remplir et valider le formulaire
- Vérifier qu'il n'y a plus d'erreur 500

## **APRÈS CORRECTION**

Une fois la colonne ajoutée, vous pourrez :
✅ Créer des commandes client sans erreur  
✅ Déployer les améliorations code-barres EAN13  
✅ Utiliser toutes les nouvelles fonctionnalités  

**CETTE CORRECTION EST OBLIGATOIRE AVANT TOUT AUTRE DÉPLOIEMENT !**