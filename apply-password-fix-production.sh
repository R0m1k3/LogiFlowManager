#!/bin/bash

# URGENT: Apply this fix in your production environment

echo "🚨 APPLYING CRITICAL PASSWORD FIX..."

# Step 1: Rebuild and deploy the fixed code
echo "📦 Building new Docker image..."
docker build -t logiflow:latest .

echo "🔄 Updating production container..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for container startup..."
sleep 10

# Step 2: The application will now auto-fix passwords on startup
# But we can also manually fix the admin password

echo "🔧 Checking password status in database..."
docker exec logiflow-db psql -U logiflow_admin -d logiflow_db -c "
SELECT username, 
       LENGTH(password) as pass_length,
       CASE 
         WHEN password LIKE '%.%' THEN 'OK - Already hashed'
         WHEN password IN ('admin', 'admin123') THEN 'NEEDS FIX - Plain text'
         ELSE 'UNKNOWN FORMAT'
       END as status
FROM users
WHERE username = 'admin';
"

echo "✅ Fix applied! The application will now:"
echo "   1. Accept 'admin/admin' login even with plain text password"
echo "   2. Automatically convert to hashed password on first login"
echo "   3. Show message: 'Legacy admin password detected'"
echo ""
echo "📝 Next steps:"
echo "   1. Login with username: admin, password: admin"
echo "   2. Change password immediately after login"
echo "   3. All future passwords will be properly hashed"