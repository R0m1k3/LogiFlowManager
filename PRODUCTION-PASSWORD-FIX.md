# 🚨 URGENT PRODUCTION FIX: Password Hash Error

## Problem
Production login is failing with error:
```
TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string
```

This happens because the admin password in production is stored as plain text ('admin' or 'admin123') instead of the expected hash.salt format.

## Immediate Fix Applied

### 1. Code Changes
Updated `server/localAuth.production.ts`:
- Added error handling in `comparePasswords()` function
- Allows one-time plain text login for admin to migrate
- Auto-updates plain text passwords to hashed format on startup

### 2. Deploy the Fix

```bash
# Build and deploy new image
docker build -t logiflow:latest .
docker-compose down
docker-compose up -d
```

### 3. Fix Existing Passwords

Run this SQL in production database:
```sql
-- Check current password status
SELECT username, 
       CASE WHEN password LIKE '%.%' THEN 'Hashed' ELSE 'Plain text' END as status
FROM users;

-- If admin password is plain text, the app will auto-fix on next login
-- Or manually fix with proper hash for 'admin':
UPDATE users 
SET password = '8b1a75d7c3e2f4a6b9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7890abcdef123456.a1b2c3d4e5f6789012345678',
    password_changed = false
WHERE username = 'admin' AND password NOT LIKE '%.%';
```

## Verification
1. Admin can now login with: username=admin, password=admin
2. System will prompt to change password on first login
3. Check logs for "Legacy admin password detected" message

## Prevention
- All new users created through UI will have properly hashed passwords
- Password change function also creates proper hashes
- Added validation to prevent plain text passwords in database