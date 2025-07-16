#!/bin/bash

# 🚨 SOLUTION URGENTE - Correction rôles production
# Script simplifié pour corriger immédiatement l'incohérence des rôles

echo "🚨 CORRECTION URGENTE - Rôles Production LogiFlow"
echo "=================================================="

# Vérification DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Variable DATABASE_URL non définie"
    echo "💡 Configurez-la avec: export DATABASE_URL='votre_url_postgresql'"
    exit 1
fi

# Test de connexion
echo "🔗 Test de connexion à la base..."
psql $DATABASE_URL -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Connexion échouée - Vérifiez DATABASE_URL"
    exit 1
fi
echo "✅ Connexion réussie"

echo ""
echo "🔍 DIAGNOSTIC AVANT CORRECTION"
echo "------------------------------"
psql $DATABASE_URL -c "
SELECT 
  u.username, 
  u.role as users_role,
  COALESCE(r.name, 'AUCUN') as user_roles_table,
  CASE 
    WHEN u.role = r.name THEN '✅ OK'
    WHEN r.name IS NULL THEN '❌ MANQUANT' 
    ELSE '❌ DIFFÉRENT'
  END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

echo ""
echo "🔧 APPLICATION DU CORRECTIF"
echo "---------------------------"

# Sauvegarde rapide
echo "💾 Sauvegarde rapide..."
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS user_roles_backup_$(date +%Y%m%d) AS 
SELECT * FROM user_roles;
" > /dev/null

# Correction des couleurs des rôles
echo "🎨 Correction des couleurs..."
psql $DATABASE_URL -c "
UPDATE roles SET color = '#f87171' WHERE name = 'admin';
UPDATE roles SET color = '#60a5fa' WHERE name = 'manager';  
UPDATE roles SET color = '#4ade80' WHERE name = 'employee';
UPDATE roles SET color = '#a78bfa' WHERE name = 'directeur';
"

# Nettoyage et resynchronisation
echo "🔄 Resynchronisation des rôles..."
psql $DATABASE_URL -c "
-- Nettoyer les assignations existantes
DELETE FROM user_roles;

-- Resynchroniser avec la colonne users.role
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
  u.id,
  r.id,
  'admin_local',
  NOW()
FROM users u
JOIN roles r ON u.role = r.name
WHERE u.role IS NOT NULL;
"

echo ""
echo "✅ CORRECTION APPLIQUÉE"
echo ""
echo "🧪 VÉRIFICATION FINALE"
echo "----------------------"
psql $DATABASE_URL -c "
SELECT 
  u.username, 
  u.role as users_role,
  r.name as user_roles_table,
  r.color,
  CASE 
    WHEN u.role = r.name THEN '✅ SYNCHRONISÉ'
    ELSE '❌ PROBLÈME'
  END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
"

echo ""
echo "📊 RÉSUMÉ DES RÔLES"
echo "------------------"
psql $DATABASE_URL -c "
SELECT 
  r.name as role,
  r.display_name,
  r.color,
  COUNT(ur.user_id) as users_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.display_name, r.color
ORDER BY r.id;
"

echo ""
echo "🎉 CORRECTION TERMINÉE!"
echo "======================"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Redémarrez votre application LogiFlow"
echo "   2. Testez les pages Utilisateurs et Rôles"
echo "   3. Vérifiez que les couleurs s'affichent correctement"
echo ""
echo "🔍 Si le problème persiste:"
echo "   - Videz le cache du navigateur (Ctrl+F5)"
echo "   - Vérifiez les logs de l'application"
echo ""

exit 0