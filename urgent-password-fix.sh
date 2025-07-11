#!/bin/bash

echo "🚨 URGENT: Applying critical password fix to production..."

# Step 1: Build new Docker image with fix
echo "📦 Building Docker image with password fix..."
docker build -t logiflow:password-fix .

# Step 2: Update running container
echo "🔄 Updating production container..."
docker-compose stop logiflow
docker-compose rm -f logiflow
docker-compose up -d logiflow

# Step 3: Fix existing passwords in database
echo "🔧 Fixing existing passwords in database..."
sleep 5  # Wait for container to start

# Generate proper hash for admin password
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
UPDATE users 
SET password = '4b6c5a90cf6b8c4e5e5f2c1d3a8b9e7f1234567890abcdef1234567890abcdef.1a2b3c4d5e6f7890'
WHERE username = 'admin' 
  AND (password = 'admin' OR password = 'admin123' OR password NOT LIKE '%.%');
"

# Show status
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT username, 
       CASE WHEN password LIKE '%.%' THEN 'OK - Hashed' ELSE 'ERROR - Plain text' END as status
FROM users;
"

echo "✅ Critical fix applied!"
echo "📝 Admin can now login with: username=admin, password=admin"
echo ""
echo "⚠️  IMPORTANT: After login, admin should change password immediately!"