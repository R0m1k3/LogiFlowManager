# 🚨 EXÉCUTEZ CES COMMANDES MAINTENANT SUR VOTRE SERVEUR

## Connectez-vous à votre serveur et exécutez :

```bash
# 1. COPIER-COLLER CETTE COMMANDE COMPLÈTE :
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db << 'EOF'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE deliveries SET scheduled_date = COALESCE(planned_date::DATE, CURRENT_DATE) WHERE scheduled_date IS NULL;
\q
EOF

# 2. PUIS REDÉMARRER :
docker restart logiflow-app
```

## OU utilisez le script rapide :

```bash
# Copiez fix-now.sh sur votre serveur et exécutez :
./fix-now.sh
```

**C'EST TOUT ! La colonne "notes" sera ajoutée et l'erreur disparaîtra.**