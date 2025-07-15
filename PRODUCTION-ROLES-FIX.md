# Correction des Données de Rôles en Production

## Problème Identifié
- Erreur "Rôle ID 6 n'est pas valide" en production
- Couleurs de rôles incorrectes (gris au lieu des couleurs spécifiques)
- Données corrompues dans la base de données de production

## Solution Rapide

### Option 1: Exécuter les commandes SQL directement
```sql
-- Corriger les rôles avec les bonnes couleurs et noms
UPDATE roles SET 
    display_name = 'Administrateur',
    description = 'Accès complet à toutes les fonctionnalités du système',
    color = '#dc2626',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'admin';

UPDATE roles SET 
    display_name = 'Manager',
    description = 'Accès à la gestion des commandes, livraisons et fournisseurs',
    color = '#2563eb',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'manager';

UPDATE roles SET 
    display_name = 'Employé',
    description = 'Accès en lecture aux données et publicités',
    color = '#16a34a',
    is_system = true,
    is_active = true,
    updated_at = NOW()
WHERE name = 'employee';

UPDATE roles SET 
    display_name = 'Directeur',
    description = 'Direction générale et supervision',
    color = '#7c3aed',
    is_system = false,
    is_active = true,
    updated_at = NOW()
WHERE name = 'directeur';

-- Supprimer les rôles invalides
DELETE FROM user_roles WHERE role_id NOT IN (1, 2, 3, 4);
DELETE FROM role_permissions WHERE role_id NOT IN (1, 2, 3, 4);
DELETE FROM roles WHERE id NOT IN (1, 2, 3, 4);

-- Corriger les assignations
UPDATE user_roles 
SET assigned_by = 'admin_local', 
    assigned_at = NOW() 
WHERE assigned_by = 'system' AND user_id != 'admin_local';
```

### Option 2: Exécuter le script bash
```bash
./fix-production-roles-data.sh
```

### Option 3: Redéployer l'application
```bash
docker-compose down && docker-compose up -d
```

## Vérification
Après la correction, vérifier que :
- Les rôles ont les bonnes couleurs
- L'erreur "Rôle ID 6" n'apparaît plus
- Les utilisateurs peuvent changer de rôles
- Les couleurs s'affichent correctement dans l'interface

## Couleurs des Rôles
- **Administrateur** (#dc2626) - Rouge
- **Manager** (#2563eb) - Bleu
- **Employé** (#16a34a) - Vert
- **Directeur** (#7c3aed) - Violet