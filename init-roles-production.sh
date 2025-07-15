#!/bin/bash

echo "=== INITIALISATION DES RÔLES EN PRODUCTION ==="
echo "Date: $(date)"
echo ""

# Créer un script d'initialisation temporaire
cat > /tmp/init_roles_production.js << 'EOF'
// Script d'initialisation des rôles et permissions pour la production
const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://logiflow_admin:LogiFlow2025!@localhost:5434/logiflow_db'
});

async function initRolesAndPermissions() {
  console.log('🔧 Initialisation des rôles et permissions...');
  
  try {
    // Créer les tables si elles n'existent pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        description TEXT,
        color VARCHAR(7) DEFAULT '#666666',
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        description TEXT,
        category VARCHAR(255),
        action VARCHAR(255),
        resource VARCHAR(255),
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by VARCHAR(255),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
      );
    `);
    
    console.log('✅ Tables créées');
    
    // Insérer les rôles par défaut
    const roles = [
      { name: 'admin', displayName: 'Administrateur', description: 'Accès complet au système', color: '#FF5722' },
      { name: 'directeur', displayName: 'Directeur', description: 'Supervision régionale', color: '#9C27B0' },
      { name: 'manager', displayName: 'Manager', description: 'Gestion des magasins et équipes', color: '#2196F3' },
      { name: 'employee', displayName: 'Employé', description: 'Accès standard aux fonctionnalités', color: '#4CAF50' }
    ];
    
    for (const role of roles) {
      await pool.query(`
        INSERT INTO roles (name, display_name, description, color, is_system, is_active) 
        VALUES ($1, $2, $3, $4, true, true)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          color = EXCLUDED.color
      `, [role.name, role.displayName, role.description, role.color]);
    }
    
    console.log('✅ Rôles créés');
    
    // Insérer les permissions par défaut
    const permissions = [
      // Dashboard
      { name: 'dashboard_read', displayName: 'Voir Dashboard', description: 'Accès au tableau de bord', category: 'dashboard', action: 'read', resource: 'dashboard' },
      
      // Orders
      { name: 'orders_read', displayName: 'Voir Commandes', description: 'Consultation des commandes', category: 'orders', action: 'read', resource: 'orders' },
      { name: 'orders_create', displayName: 'Créer Commandes', description: 'Création de nouvelles commandes', category: 'orders', action: 'create', resource: 'orders' },
      { name: 'orders_update', displayName: 'Modifier Commandes', description: 'Modification des commandes', category: 'orders', action: 'update', resource: 'orders' },
      { name: 'orders_delete', displayName: 'Supprimer Commandes', description: 'Suppression des commandes', category: 'orders', action: 'delete', resource: 'orders' },
      
      // Deliveries
      { name: 'deliveries_read', displayName: 'Voir Livraisons', description: 'Consultation des livraisons', category: 'deliveries', action: 'read', resource: 'deliveries' },
      { name: 'deliveries_create', displayName: 'Créer Livraisons', description: 'Création de nouvelles livraisons', category: 'deliveries', action: 'create', resource: 'deliveries' },
      { name: 'deliveries_update', displayName: 'Modifier Livraisons', description: 'Modification des livraisons', category: 'deliveries', action: 'update', resource: 'deliveries' },
      { name: 'deliveries_delete', displayName: 'Supprimer Livraisons', description: 'Suppression des livraisons', category: 'deliveries', action: 'delete', resource: 'deliveries' },
      { name: 'deliveries_validate', displayName: 'Valider Livraisons', description: 'Validation des livraisons', category: 'deliveries', action: 'validate', resource: 'deliveries' },
      
      // Calendar
      { name: 'calendar_read', displayName: 'Voir Calendrier', description: 'Accès au calendrier', category: 'calendar', action: 'read', resource: 'calendar' },
      
      // Users
      { name: 'users_read', displayName: 'Voir Utilisateurs', description: 'Consultation des utilisateurs', category: 'users', action: 'read', resource: 'users' },
      { name: 'users_create', displayName: 'Créer Utilisateurs', description: 'Création de nouveaux utilisateurs', category: 'users', action: 'create', resource: 'users' },
      { name: 'users_update', displayName: 'Modifier Utilisateurs', description: 'Modification des utilisateurs', category: 'users', action: 'update', resource: 'users' },
      { name: 'users_delete', displayName: 'Supprimer Utilisateurs', description: 'Suppression d\'utilisateurs', category: 'users', action: 'delete', resource: 'users' },
      
      // Roles
      { name: 'roles_read', displayName: 'Voir Rôles', description: 'Accès en lecture aux rôles', category: 'roles', action: 'read', resource: 'roles' },
      { name: 'roles_create', displayName: 'Créer Rôles', description: 'Création de nouveaux rôles', category: 'roles', action: 'create', resource: 'roles' },
      { name: 'roles_update', displayName: 'Modifier Rôles', description: 'Modification des rôles', category: 'roles', action: 'update', resource: 'roles' },
      { name: 'roles_delete', displayName: 'Supprimer Rôles', description: 'Suppression de rôles', category: 'roles', action: 'delete', resource: 'roles' },
      { name: 'roles_assign', displayName: 'Assigner Rôles', description: 'Attribution de rôles aux utilisateurs', category: 'roles', action: 'assign', resource: 'roles' },
      
      // Groups
      { name: 'groups_read', displayName: 'Voir Magasins', description: 'Consultation des magasins', category: 'groups', action: 'read', resource: 'groups' },
      { name: 'groups_create', displayName: 'Créer Magasins', description: 'Création de nouveaux magasins', category: 'groups', action: 'create', resource: 'groups' },
      { name: 'groups_update', displayName: 'Modifier Magasins', description: 'Modification des magasins', category: 'groups', action: 'update', resource: 'groups' },
      { name: 'groups_delete', displayName: 'Supprimer Magasins', description: 'Suppression de magasins', category: 'groups', action: 'delete', resource: 'groups' },
      
      // Suppliers
      { name: 'suppliers_read', displayName: 'Voir Fournisseurs', description: 'Consultation des fournisseurs', category: 'suppliers', action: 'read', resource: 'suppliers' },
      { name: 'suppliers_create', displayName: 'Créer Fournisseurs', description: 'Création de nouveaux fournisseurs', category: 'suppliers', action: 'create', resource: 'suppliers' },
      { name: 'suppliers_update', displayName: 'Modifier Fournisseurs', description: 'Modification des fournisseurs', category: 'suppliers', action: 'update', resource: 'suppliers' },
      { name: 'suppliers_delete', displayName: 'Supprimer Fournisseurs', description: 'Suppression de fournisseurs', category: 'suppliers', action: 'delete', resource: 'suppliers' },
      
      // Publicities
      { name: 'publicities_read', displayName: 'Voir Publicités', description: 'Consultation des publicités', category: 'publicities', action: 'read', resource: 'publicities' },
      { name: 'publicities_create', displayName: 'Créer Publicités', description: 'Création de nouvelles publicités', category: 'publicities', action: 'create', resource: 'publicities' },
      { name: 'publicities_update', displayName: 'Modifier Publicités', description: 'Modification des publicités', category: 'publicities', action: 'update', resource: 'publicities' },
      { name: 'publicities_delete', displayName: 'Supprimer Publicités', description: 'Suppression de publicités', category: 'publicities', action: 'delete', resource: 'publicities' },
      
      // Customer Orders
      { name: 'customer_orders_read', displayName: 'Voir Commandes Client', description: 'Consultation des commandes client', category: 'customer_orders', action: 'read', resource: 'customer_orders' },
      { name: 'customer_orders_create', displayName: 'Créer Commandes Client', description: 'Création de nouvelles commandes client', category: 'customer_orders', action: 'create', resource: 'customer_orders' },
      { name: 'customer_orders_update', displayName: 'Modifier Commandes Client', description: 'Modification des commandes client', category: 'customer_orders', action: 'update', resource: 'customer_orders' },
      { name: 'customer_orders_delete', displayName: 'Supprimer Commandes Client', description: 'Suppression de commandes client', category: 'customer_orders', action: 'delete', resource: 'customer_orders' },
      { name: 'customer_orders_print', displayName: 'Imprimer Étiquettes', description: 'Impression d\'étiquettes commandes client', category: 'customer_orders', action: 'print', resource: 'customer_orders' },
      { name: 'customer_orders_notify', displayName: 'Notifier Client', description: 'Notification clients commandes prêtes', category: 'customer_orders', action: 'notify', resource: 'customer_orders' },
      
      // BL Reconciliation
      { name: 'bl_reconciliation_read', displayName: 'Voir Rapprochement', description: 'Consultation rapprochement BL/Factures', category: 'bl_reconciliation', action: 'read', resource: 'bl_reconciliation' },
      { name: 'bl_reconciliation_update', displayName: 'Modifier Rapprochement', description: 'Modification rapprochement BL/Factures', category: 'bl_reconciliation', action: 'update', resource: 'bl_reconciliation' }
    ];
    
    for (const permission of permissions) {
      await pool.query(`
        INSERT INTO permissions (name, display_name, description, category, action, resource, is_system) 
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          action = EXCLUDED.action,
          resource = EXCLUDED.resource
      `, [permission.name, permission.displayName, permission.description, permission.category, permission.action, permission.resource]);
    }
    
    console.log('✅ Permissions créées');
    
    // Assigner toutes les permissions au rôle admin
    const adminRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    if (adminRoleResult.rows.length > 0) {
      const adminRoleId = adminRoleResult.rows[0].id;
      
      const permissionsResult = await pool.query('SELECT id FROM permissions');
      for (const permission of permissionsResult.rows) {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [adminRoleId, permission.id]);
      }
      
      console.log('✅ Permissions assignées au rôle admin');
    }
    
    // Assigner les permissions de base aux autres rôles
    const dirRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['directeur']);
    const mgRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['manager']);
    const empRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['employee']);
    
    if (dirRoleResult.rows.length > 0) {
      const dirRoleId = dirRoleResult.rows[0].id;
      const dirPermissions = ['dashboard_read', 'orders_read', 'orders_create', 'orders_update', 'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_validate', 'calendar_read', 'users_read', 'groups_read', 'suppliers_read', 'publicities_read', 'customer_orders_read', 'bl_reconciliation_read'];
      
      for (const permName of dirPermissions) {
        const permResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rows.length > 0) {
          await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [dirRoleId, permResult.rows[0].id]);
        }
      }
      console.log('✅ Permissions assignées au directeur');
    }
    
    if (mgRoleResult.rows.length > 0) {
      const mgRoleId = mgRoleResult.rows[0].id;
      const mgPermissions = ['dashboard_read', 'orders_read', 'orders_create', 'orders_update', 'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_validate', 'calendar_read', 'groups_read', 'groups_create', 'groups_update', 'suppliers_read', 'suppliers_create', 'suppliers_update', 'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'bl_reconciliation_read'];
      
      for (const permName of mgPermissions) {
        const permResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rows.length > 0) {
          await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [mgRoleId, permResult.rows[0].id]);
        }
      }
      console.log('✅ Permissions assignées au manager');
    }
    
    if (empRoleResult.rows.length > 0) {
      const empRoleId = empRoleResult.rows[0].id;
      const empPermissions = ['dashboard_read', 'orders_read', 'orders_create', 'deliveries_read', 'deliveries_create', 'calendar_read', 'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'customer_orders_print', 'customer_orders_notify'];
      
      for (const permName of empPermissions) {
        const permResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rows.length > 0) {
          await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [empRoleId, permResult.rows[0].id]);
        }
      }
      console.log('✅ Permissions assignées à l\'employé');
    }
    
    // Afficher le résumé
    const rolesCount = await pool.query('SELECT COUNT(*) as count FROM roles');
    const permissionsCount = await pool.query('SELECT COUNT(*) as count FROM permissions');
    const rolePermissionsCount = await pool.query('SELECT COUNT(*) as count FROM role_permissions');
    
    console.log('📊 RÉSUMÉ:');
    console.log(`  - Rôles: ${rolesCount.rows[0].count}`);
    console.log(`  - Permissions: ${permissionsCount.rows[0].count}`);
    console.log(`  - Assignations: ${rolePermissionsCount.rows[0].count}`);
    
    console.log('🎉 Initialisation terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter l'initialisation
initRolesAndPermissions().catch(console.error);
EOF

echo "🚀 Exécution de l'initialisation des rôles..."

# Exécuter le script d'initialisation
if command -v node > /dev/null 2>&1; then
    node /tmp/init_roles_production.js
else
    echo "❌ Node.js non disponible"
    exit 1
fi

# Nettoyer le fichier temporaire
rm -f /tmp/init_roles_production.js

echo ""
echo "✅ Initialisation des rôles terminée!"
echo "📍 Vous pouvez maintenant accéder au module de gestion des rôles"
echo "🎭 Menu: Administration > Gestion des Rôles"