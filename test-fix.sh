#!/bin/bash

echo "🧪 TEST DE LA CORRECTION"
echo "======================="

# Test 1: Vérification du schéma
echo "1. Vérification du schéma de base..."
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') 
        THEN '✅ orders.notes OK'
        ELSE '❌ orders.notes MANQUANT'
    END as orders_notes,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='notes') 
        THEN '✅ deliveries.notes OK'
        ELSE '❌ deliveries.notes MANQUANT'
    END as deliveries_notes;
"

# Test 2: Test API
echo ""
echo "2. Test de l'API..."
curl -s http://localhost:3000/api/debug/status

# Test 3: Test création commande
echo ""
echo "3. Test création commande..."
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": 1,
    "groupId": 1,
    "plannedDate": "2025-01-15",
    "status": "pending",
    "notes": "Test correction",
    "createdBy": "admin"
  }' | head -1

echo ""
echo "FIN DES TESTS"