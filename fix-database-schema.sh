#!/bin/bash

echo "🔧 CORRECTION SCHÉMA BASE DE DONNÉES PRODUCTION"
echo "============================================="

echo "📝 PROBLÈME IDENTIFIÉ:"
echo "- Colonne 'name' manquante dans la table users"
echo "- Schéma TypeScript mis à jour mais pas la base de données"
echo "- Nécessité d'ajouter la colonne en production"
echo ""

echo "✅ CORRECTIONS À APPLIQUER:"
echo "1. Ajouter la colonne 'name' à la table users"
echo "2. Corriger les requêtes SQL brutes"
echo "3. Mettre à jour les fichiers de production"
echo ""

echo "🚀 COMMANDES SQL PRODUCTION:"
echo "ALTER TABLE users ADD COLUMN name VARCHAR(255);"
echo ""

echo "📋 FICHIERS À DÉPLOYER:"
echo "- server/storage.production.ts (requêtes SQL corrigées)"
echo "- shared/schema.ts (schéma avec colonne name)"
echo ""

echo "🎯 DÉPLOIEMENT PRODUCTION:"
echo "1. Connectez-vous à la base PostgreSQL production"
echo "2. Exécutez : ALTER TABLE users ADD COLUMN name VARCHAR(255);"
echo "3. Reconstruisez l'image Docker avec les fichiers corrigés"
echo "4. Redémarrez l'application"
echo ""

echo "⚠️  IMPORTANT:"
echo "- La colonne 'name' doit être ajoutée à la base de données avant le déploiement"
echo "- Sans cela, l'application ne pourra pas démarrer"
echo "- Vérifiez que la colonne existe avec : \\d users"