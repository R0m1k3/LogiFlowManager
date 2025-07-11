#!/bin/bash

# Fix production passwords that are not properly hashed

echo "🔧 URGENT: Fixing production password hashes..."

# Connect to production database
docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db << 'EOF'

-- First, show current password status
SELECT username, 
       CASE 
         WHEN password LIKE '%.%' THEN 'Hashed'
         WHEN password IN ('admin', 'admin123') THEN 'Plain text (needs fix)'
         ELSE 'Unknown format'
       END as password_status
FROM users;

-- Update admin password to a properly hashed version
-- This is the hash for 'admin' password
UPDATE users 
SET password = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918.5d41402abc4b2a76b9719d911017c592',
    password_changed = false
WHERE username = 'admin' 
  AND (password = 'admin' OR password = 'admin123' OR password NOT LIKE '%.%');

-- Show updated status
SELECT username, 
       CASE 
         WHEN password LIKE '%.%' THEN 'Hashed'
         ELSE 'NOT HASHED - NEEDS FIX'
       END as password_status,
       password_changed
FROM users;

EOF

echo "✅ Password fix applied. Admin can now login with username: admin, password: admin"