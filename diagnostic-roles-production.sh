#!/bin/bash

# Script de diagnostic rapide pour les rôles en production

echo "🔍 DIAGNOSTIC - Rôles Production LogiFlow"
echo "=========================================="

# Vérification connexion
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Variable DATABASE_URL non définie"
    exit 1
fi

psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Connexion base de données échouée"
    exit 1
fi

echo "✅ Connexion établie"
echo ""

echo "📊 ÉTAT ACTUEL DES RÔLES"
echo "------------------------"
psql $DATABASE_URL -c "
SELECT 
  '=== UTILISATEURS ET LEURS RÔLES ===' as section;
  
SELECT 
  u.username as utilisateur,
  u.role as colonne_users_role,
  COALESCE(r.name, 'AUCUN') as table_user_roles,
  COALESCE(r.color, 'AUCUNE') as couleur,
  CASE 
    WHEN u.role = r.name THEN '✅ OK'
    WHEN r.name IS NULL THEN '❌ MANQUANT DANS user_roles' 
    ELSE '❌ INCOHÉRENT'
  END as statut
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

SELECT '';
SELECT '=== RÔLES DISPONIBLES ===' as section;

SELECT 
  id,
  name as nom,
  display_name as nom_affiche,
  CASE 
    WHEN color IS NULL OR color = '' THEN '❌ AUCUNE'
    ELSE color
  END as couleur
FROM roles
ORDER BY id;
"

echo ""
echo "🔧 SOLUTION"
echo "----------"
echo "Pour corriger l'incohérence:"
echo "1. Exécutez: bash fix-production-roles-urgent.sh"
echo "2. Ou utilisez: bash apply-production-roles-fix.sh (si Docker)"
echo ""