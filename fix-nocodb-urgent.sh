#!/bin/bash

# Script de correction urgente - Table nocodb_configs manquante
# Date: 2025-07-14
# Fix: "relation nocodb_configs does not exist"

echo "🚨 === CORRECTION URGENTE NOCODB PRODUCTION ==="
echo "⏰ $(date)"
echo ""

echo "🔧 PROBLÈME CRITIQUE IDENTIFIÉ:"
echo "❌ Error: relation \"nocodb_configs\" does not exist"
echo "❌ L'utilisateur ne peut pas créer de configurations NocoDB"
echo ""

echo "💡 SOLUTION:"
echo "✅ Créer la table nocodb_configs en production"
echo "✅ Ajouter les colonnes NocoDB dans la table groups"
echo ""

echo "📋 INSTRUCTIONS POUR APPLIQUER LA CORRECTION:"
echo ""
echo "1. CONNECTEZ-VOUS À LA BASE PRODUCTION:"
echo "   psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db"
echo ""
echo "2. EXÉCUTEZ LE SCRIPT SQL:"
echo "   \\i apply-nocodb-table.sql"
echo ""
echo "3. VÉRIFIEZ LA CRÉATION:"
echo "   \\d nocodb_configs"
echo ""
echo "4. REDÉMARREZ L'APPLICATION:"
echo "   docker-compose restart logiflow-app"
echo ""

echo "📄 === CONTENU DU SCRIPT SQL ==="
echo "Le fichier apply-nocodb-table.sql contient:"
echo "✅ CREATE TABLE nocodb_configs (avec toutes les colonnes)"
echo "✅ ALTER TABLE groups ADD COLUMN nocodb_config_id"
echo "✅ ALTER TABLE groups ADD COLUMN nocodb_table_id"
echo "✅ ALTER TABLE groups ADD COLUMN nocodb_table_name"
echo "✅ ALTER TABLE groups ADD COLUMN invoice_column_name"
echo "✅ Index pour optimiser les performances"
echo ""

echo "🔍 === VÉRIFICATION RECOMMANDÉE ==="
echo "Après application du script, testez:"
echo "1. Connexion à l'interface d'administration"
echo "2. Accès au module de configuration NocoDB"
echo "3. Création d'une nouvelle configuration"
echo ""

echo "⚡ === SOLUTION ALTERNATIVE RAPIDE ==="
echo "Si vous préférez appliquer la migration complète:"
echo "   psql -h localhost -p 5434 -U logiflow_admin -d logiflow_db < migration-production.sql"
echo ""

echo "✅ === FICHIERS PRÊTS ==="
echo "📁 apply-nocodb-table.sql - Migration spécifique NocoDB"
echo "📁 migration-production.sql - Migration complète"
echo ""
echo "🎯 Une fois appliqué, l'erreur \"relation nocodb_configs does not exist\" sera résolue !"