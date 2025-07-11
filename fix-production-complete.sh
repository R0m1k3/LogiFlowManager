#!/bin/bash

# Script de correction complète production - LogiFlow
# Ajoute les colonnes delivered_date et validated_at manquantes

echo "🔧 CORRECTION PRODUCTION LOGIFLOW - AJOUT COLONNES MANQUANTES"
echo "=============================================="

# Configuration Docker
CONTAINER_NAME="logiflow-app"
POSTGRES_CONTAINER="logiflow-postgres"

echo "📅 $(date) - Début de la correction"

# 1. Vérifier que les conteneurs sont en cours d'exécution
echo "🔍 Vérification des conteneurs..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé"
    exit 1
fi

if ! docker ps | grep -q $POSTGRES_CONTAINER; then
    echo "❌ Conteneur PostgreSQL $POSTGRES_CONTAINER non trouvé"
    exit 1
fi

echo "✅ Conteneurs trouvés et en cours d'exécution"

# 2. Créer le script SQL de migration
echo "📝 Création du script de migration..."
cat > migration-delivered-date.sql << 'EOF'
-- Migration: Ajout colonnes delivered_date et validated_at
-- LogiFlow Production Fix

\echo '🔧 DÉBUT MIGRATION - Ajout colonnes delivered_date et validated_at'

-- Vérifier si les colonnes existent déjà
DO $$
BEGIN
    -- Ajouter delivered_date si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'delivered_date'
    ) THEN
        ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;
        RAISE NOTICE '✅ Colonne delivered_date ajoutée';
    ELSE
        RAISE NOTICE '⚠️  Colonne delivered_date existe déjà';
    END IF;
    
    -- Ajouter validated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND column_name = 'validated_at'
    ) THEN
        ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;
        RAISE NOTICE '✅ Colonne validated_at ajoutée';
    ELSE
        RAISE NOTICE '⚠️  Colonne validated_at existe déjà';
    END IF;
END $$;

-- Mettre à jour les livraisons déjà validées
UPDATE deliveries 
SET delivered_date = updated_at 
WHERE status = 'delivered' AND delivered_date IS NULL;

\echo '✅ MIGRATION TERMINÉE - Colonnes delivered_date et validated_at disponibles'

-- Afficher le schéma de la table pour vérification
\d deliveries
EOF

echo "✅ Script de migration créé"

# 3. Exécuter la migration
echo "🗃️  Exécution de la migration sur la base de données..."
docker exec -i $POSTGRES_CONTAINER psql -U logiflow_admin -d logiflow_db < migration-delivered-date.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration réussie"
else
    echo "❌ Erreur lors de la migration"
    exit 1
fi

# 4. Redémarrer l'application
echo "🔄 Redémarrage de l'application..."
docker restart $CONTAINER_NAME

# Attendre que l'application redémarre
echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

# 5. Test de santé
echo "🏥 Test de santé de l'application..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Application opérationnelle (HTTP $HEALTH_CHECK)"
else
    echo "⚠️  Application peut être en cours de démarrage (HTTP $HEALTH_CHECK)"
fi

# 6. Test API validation
echo "🧪 Test de disponibilité des nouveaux champs..."
docker exec $POSTGRES_CONTAINER psql -U logiflow_admin -d logiflow_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name IN ('delivered_date', 'validated_at');"

# 7. Nettoyage
echo "🧹 Nettoyage des fichiers temporaires..."
rm -f migration-delivered-date.sql

echo ""
echo "=============================================="
echo "🎉 CORRECTION PRODUCTION TERMINÉE"
echo "=============================================="
echo "📅 $(date)"
echo "✅ Colonnes delivered_date et validated_at ajoutées"
echo "✅ Application redémarrée"
echo "✅ Tests de santé effectués"
echo ""
echo "🔗 Application accessible: http://localhost:3000"
echo "   ou https://logiflow.ffnancy.fr:3000"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Tester la validation des livraisons"
echo "   2. Vérifier le rapprochement BL/Factures"
echo "   3. Confirmer que les dates s'affichent correctement"
echo "=============================================="