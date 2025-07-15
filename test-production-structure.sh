#!/bin/bash

echo "🔍 TEST STRUCTURE DONNÉES PRODUCTION"
echo "======================================"

# Login
echo "1️⃣ Connexion admin..."
curl -s -c /tmp/test_cookies -X POST http://localhost:5000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Login réussi"
else
  echo "❌ Échec login"
  exit 1
fi

echo ""
echo "2️⃣ Structure permissions (première permission):"
echo "----------------------------------------------"
PERM_JSON=$(curl -s -b /tmp/test_cookies http://localhost:5000/api/permissions)
echo "$PERM_JSON" | jq -r '.[0] | "ID: \(.id) | Name: \(.name) | DisplayName: \(.displayName // "MANQUANT") | Action: \(.action // "MANQUANT") | Category: \(.category)"' 2>/dev/null || echo "Erreur parsing JSON permissions"

echo ""
echo "3️⃣ Structure rôles (premier rôle):"
echo "-----------------------------------"
ROLES_JSON=$(curl -s -b /tmp/test_cookies http://localhost:5000/api/roles)
echo "$ROLES_JSON" | jq -r '.[0] | "ID: \(.id) | Name: \(.name) | DisplayName: \(.displayName // "MANQUANT") | Permissions: \(.permissions | length)"' 2>/dev/null || echo "Erreur parsing JSON rôles"

echo ""
echo "4️⃣ Première permission du premier rôle:"
echo "---------------------------------------"
echo "$ROLES_JSON" | jq -r '.[0].permissions[0] | "ID: \(.id) | Name: \(.name) | DisplayName: \(.displayName // "MANQUANT") | Action: \(.action // "MANQUANT")"' 2>/dev/null || echo "Pas de permissions dans les rôles"

echo ""
echo "5️⃣ Vérification React Error #310 - Toutes propriétés requises:"
echo "--------------------------------------------------------------"

# Test displayName permissions
MISSING_DISPLAY=$(echo "$PERM_JSON" | jq -r '.[] | select(.displayName == null or .displayName == "") | .name' 2>/dev/null)
if [ -z "$MISSING_DISPLAY" ]; then
  echo "✅ Toutes permissions ont displayName"
else
  echo "❌ Permissions sans displayName: $MISSING_DISPLAY"
fi

# Test action permissions
MISSING_ACTION=$(echo "$PERM_JSON" | jq -r '.[] | select(.action == null or .action == "") | .name' 2>/dev/null)
if [ -z "$MISSING_ACTION" ]; then
  echo "✅ Toutes permissions ont action"
else
  echo "❌ Permissions sans action: $MISSING_ACTION"
fi

# Test structure rôles
INVALID_ROLES=$(echo "$ROLES_JSON" | jq -r '.[] | select(.displayName == null or .displayName == "") | .name' 2>/dev/null)
if [ -z "$INVALID_ROLES" ]; then
  echo "✅ Tous rôles ont displayName"
else
  echo "❌ Rôles sans displayName: $INVALID_ROLES"
fi

echo ""
echo "6️⃣ RÉSUMÉ:"
echo "----------"
PERM_COUNT=$(echo "$PERM_JSON" | jq '. | length' 2>/dev/null || echo "0")
ROLES_COUNT=$(echo "$ROLES_JSON" | jq '. | length' 2>/dev/null || echo "0")
echo "Permissions: $PERM_COUNT"
echo "Rôles: $ROLES_COUNT"

rm -f /tmp/test_cookies
echo "✅ Test terminé"