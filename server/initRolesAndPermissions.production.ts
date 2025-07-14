import { pool } from "./db.production";

export async function initializeRolesAndPermissions() {
  try {
    console.log("🔧 Initializing roles and permissions for production...");
    
    // Test database connection first
    const client = await pool.connect();
    
    // Check if roles table exists
    const rolesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `);
    
    if (!rolesTableExists.rows[0].exists) {
      console.log("⚠️  Roles table does not exist, skipping initialization");
      client.release();
      return;
    }
    
    // Check if default roles exist
    const existingRoles = await client.query(`
      SELECT name FROM roles WHERE name IN ('admin', 'manager', 'employee');
    `);
    
    if (existingRoles.rows.length === 0) {
      console.log("📝 Creating default roles...");
      
      // Create default roles
      await client.query(`
        INSERT INTO roles (name, description, is_system) VALUES 
        ('admin', 'Administrateur système', true),
        ('manager', 'Gestionnaire', true),
        ('employee', 'Employé', true)
        ON CONFLICT (name) DO NOTHING;
      `);
      
      console.log("✅ Default roles created");
    } else {
      console.log("✅ Default roles already exist");
    }
    
    // Check if permissions exist
    const existingPermissions = await client.query(`
      SELECT COUNT(*) as count FROM permissions;
    `);
    
    if (existingPermissions.rows[0].count === '0') {
      console.log("📝 Creating default permissions...");
      
      // Create default permissions
      const permissions = [
        // Dashboard
        { category: 'dashboard', action: 'read', description: 'Voir le tableau de bord' },
        
        // Calendar
        { category: 'calendar', action: 'read', description: 'Voir le calendrier' },
        { category: 'calendar', action: 'create', description: 'Créer des événements' },
        { category: 'calendar', action: 'update', description: 'Modifier des événements' },
        { category: 'calendar', action: 'delete', description: 'Supprimer des événements' },
        
        // Orders
        { category: 'orders', action: 'read', description: 'Voir les commandes' },
        { category: 'orders', action: 'create', description: 'Créer des commandes' },
        { category: 'orders', action: 'update', description: 'Modifier des commandes' },
        { category: 'orders', action: 'delete', description: 'Supprimer des commandes' },
        
        // Deliveries
        { category: 'deliveries', action: 'read', description: 'Voir les livraisons' },
        { category: 'deliveries', action: 'create', description: 'Créer des livraisons' },
        { category: 'deliveries', action: 'update', description: 'Modifier des livraisons' },
        { category: 'deliveries', action: 'delete', description: 'Supprimer des livraisons' },
        { category: 'deliveries', action: 'validate', description: 'Valider des livraisons' },
        
        // Users
        { category: 'users', action: 'read', description: 'Voir les utilisateurs' },
        { category: 'users', action: 'create', description: 'Créer des utilisateurs' },
        { category: 'users', action: 'update', description: 'Modifier des utilisateurs' },
        { category: 'users', action: 'delete', description: 'Supprimer des utilisateurs' },
        
        // Groups
        { category: 'groups', action: 'read', description: 'Voir les magasins' },
        { category: 'groups', action: 'create', description: 'Créer des magasins' },
        { category: 'groups', action: 'update', description: 'Modifier des magasins' },
        { category: 'groups', action: 'delete', description: 'Supprimer des magasins' },
        
        // Suppliers
        { category: 'suppliers', action: 'read', description: 'Voir les fournisseurs' },
        { category: 'suppliers', action: 'create', description: 'Créer des fournisseurs' },
        { category: 'suppliers', action: 'update', description: 'Modifier des fournisseurs' },
        { category: 'suppliers', action: 'delete', description: 'Supprimer des fournisseurs' },
        
        // Publicities
        { category: 'publicities', action: 'read', description: 'Voir les publicités' },
        { category: 'publicities', action: 'create', description: 'Créer des publicités' },
        { category: 'publicities', action: 'update', description: 'Modifier des publicités' },
        { category: 'publicities', action: 'delete', description: 'Supprimer des publicités' },
        
        // Customer Orders
        { category: 'customer_orders', action: 'read', description: 'Voir les commandes clients' },
        { category: 'customer_orders', action: 'create', description: 'Créer des commandes clients' },
        { category: 'customer_orders', action: 'update', description: 'Modifier des commandes clients' },
        { category: 'customer_orders', action: 'delete', description: 'Supprimer des commandes clients' },
        { category: 'customer_orders', action: 'print', description: 'Imprimer des étiquettes' },
        { category: 'customer_orders', action: 'notify', description: 'Notifier les clients' },
        
        // Roles
        { category: 'roles', action: 'read', description: 'Voir les rôles' },
        { category: 'roles', action: 'create', description: 'Créer des rôles' },
        { category: 'roles', action: 'update', description: 'Modifier des rôles' },
        { category: 'roles', action: 'delete', description: 'Supprimer des rôles' }
      ];
      
      for (const perm of permissions) {
        await client.query(`
          INSERT INTO permissions (category, action, description) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (category, action) DO NOTHING;
        `, [perm.category, perm.action, perm.description]);
      }
      
      console.log("✅ Default permissions created");
    } else {
      console.log("✅ Default permissions already exist");
    }
    
    client.release();
    console.log("🎯 Roles and permissions initialization completed successfully");
    
  } catch (error) {
    console.error("❌ Error initializing roles and permissions:", error);
    throw error;
  }
}