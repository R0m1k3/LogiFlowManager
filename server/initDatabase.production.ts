import { pool } from "./db.production";

export async function initializeDatabase() {
  console.log("🔄 CRITICAL: Initializing database schema with raw SQL...");
  
  try {
    // STEP 1: Create users table with name column included from the start
    console.log("🔧 Creating users table with name column...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        username VARCHAR UNIQUE NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
        password VARCHAR NOT NULL,
        password_changed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // STEP 2: Force check if name column exists using raw SQL
    console.log("🔧 CRITICAL: Verifying name column exists...");
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log("🚨 CRITICAL: Name column missing! Adding immediately...");
      await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
      
      // Update existing users
      await pool.query(`
        UPDATE users 
        SET name = COALESCE(username, email) 
        WHERE name IS NULL OR name = ''
      `);
      console.log("✅ CRITICAL: Name column added and populated successfully");
    } else {
      console.log("✅ CRITICAL: Name column confirmed present");
    }
    
    // STEP 3: Double-check by attempting to select from name column
    try {
      await pool.query(`SELECT name FROM users LIMIT 1`);
      console.log("✅ CRITICAL: Name column verified working");
    } catch (error) {
      console.error("❌ CRITICAL: Name column still not working:", error.message);
      throw new Error("Name column verification failed");
    }

    // Create groups table using raw SQL
    console.log("🔧 Creating groups table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        color VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create suppliers table using raw SQL
    console.log("🔧 Creating suppliers table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        contact VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table using raw SQL
    console.log("🔧 Creating orders table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        planned_date VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'received')),
        notes TEXT,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deliveries table using raw SQL
    console.log("🔧 Creating deliveries table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        scheduled_date VARCHAR NOT NULL,
        quantity INTEGER,
        unit VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'delivered')),
        notes TEXT,
        bl_number VARCHAR,
        bl_amount DECIMAL(10,2),
        invoice_reference VARCHAR,
        invoice_amount DECIMAL(10,2),
        reconciled BOOLEAN DEFAULT FALSE,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_groups table using raw SQL (without id column for simplicity)
    console.log("🔧 Creating user_groups table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        user_id VARCHAR NOT NULL,
        group_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, group_id)
      )
    `);

    // Create session table for session storage using raw SQL
    console.log("🔧 Creating session table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);

    // AJOUT TABLES PUBLICITÉS
    console.log("🔧 Creating publicities table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publicities (
        id SERIAL PRIMARY KEY,
        pub_number VARCHAR NOT NULL,
        designation TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        year INTEGER NOT NULL,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🔧 Creating publicity_participations table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publicity_participations (
        publicity_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (publicity_id, group_id)
      )
    `);

    // Index pour les publicités
    console.log("🔧 Creating publicity indexes...");
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicities_year ON publicities (year)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicities_start_date ON publicities (start_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicities_end_date ON publicities (end_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicities_created_by ON publicities (created_by)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicity_participations_publicity_id ON publicity_participations (publicity_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_publicity_participations_group_id ON publicity_participations (group_id)`);

    // AJOUT TABLES SYSTÈME DE RÔLES ET PERMISSIONS
    console.log("🔧 Creating roles table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🔧 Creating permissions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🔧 Creating role_permissions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // Index pour les rôles et permissions
    console.log("🔧 Creating roles and permissions indexes...");
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_roles_name ON roles (name)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles (is_system)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions (category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id)`);

    // AJOUT TABLE NOCODB_CONFIGS
    console.log("🔧 Creating nocodb_configs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nocodb_configs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        base_url VARCHAR(500) NOT NULL,
        api_token VARCHAR(500) NOT NULL,
        project_id VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour nocodb_configs
    console.log("🔧 Creating nocodb_configs indexes...");
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_nocodb_configs_name ON nocodb_configs (name)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_nocodb_configs_active ON nocodb_configs (is_active)`);

    // Note: No default test data inserted in production
    // Groups and suppliers will be created by administrators as needed
    console.log("✅ Database schema ready - no test data inserted");

    // Reset sequences using raw SQL (only if data exists)
    console.log("🔧 Resetting sequences...");
    await pool.query(`SELECT setval('groups_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM groups), 1))`);
    await pool.query(`SELECT setval('suppliers_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM suppliers), 1))`);
    await pool.query(`SELECT setval('publicities_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM publicities), 1))`);
    await pool.query(`SELECT setval('roles_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM roles), 1))`);
    await pool.query(`SELECT setval('permissions_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM permissions), 1))`);

    // NOUVELLE MIGRATION AUTOMATIQUE - Ajout colonnes delivered_date et validated_at
    console.log('🔄 [MIGRATION] Vérification des colonnes delivered_date et validated_at...');
    
    try {
      // Vérifier si delivered_date existe
      const deliveredDateCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'deliveries' AND column_name = 'delivered_date'
        );
      `);
      
      // Vérifier si validated_at existe
      const validatedAtCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'deliveries' AND column_name = 'validated_at'
        );
      `);
      
      const hasDeliveredDate = deliveredDateCheck.rows[0]?.exists || false;
      const hasValidatedAt = validatedAtCheck.rows[0]?.exists || false;
      
      // Ajouter delivered_date si elle n'existe pas
      if (!hasDeliveredDate) {
        console.log('🔧 [MIGRATION] Ajout de la colonne delivered_date...');
        await pool.query(`ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP;`);
        console.log('✅ [MIGRATION] Colonne delivered_date ajoutée avec succès');
        
        // Migrer les données existantes
        await pool.query(`
          UPDATE deliveries 
          SET delivered_date = updated_at 
          WHERE status = 'delivered' AND delivered_date IS NULL;
        `);
        console.log('✅ [MIGRATION] Données delivered_date migrées');
      } else {
        console.log('✅ [MIGRATION] Colonne delivered_date déjà présente');
      }
      
      // Ajouter validated_at si elle n'existe pas
      if (!hasValidatedAt) {
        console.log('🔧 [MIGRATION] Ajout de la colonne validated_at...');
        await pool.query(`ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP;`);
        console.log('✅ [MIGRATION] Colonne validated_at ajoutée avec succès');
      } else {
        console.log('✅ [MIGRATION] Colonne validated_at déjà présente');
      }
      
      // CORRECTION CONTRAINTE ORDERS - Permettre le statut "delivered"
      console.log('🔧 [MIGRATION] Correction contrainte orders_status_check...');
      try {
        // Supprimer l'ancienne contrainte
        await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
        
        // Ajouter la nouvelle contrainte avec "delivered"
        await pool.query(`
          ALTER TABLE orders ADD CONSTRAINT orders_status_check 
          CHECK (status IN ('pending', 'planned', 'delivered'));
        `);
        
        console.log('✅ [MIGRATION] Contrainte orders_status_check corrigée - "delivered" maintenant autorisé');
      } catch (constraintError) {
        console.warn('⚠️ [MIGRATION] Erreur contrainte orders:', constraintError.message);
      }
      
      // MIGRATION NOCODB - Ajout colonnes NocoDB dans groups
      console.log('🔧 [MIGRATION] Vérification des colonnes NocoDB dans groups...');
      
      // Vérifier et ajouter nocodb_config_id
      const nocodbConfigIdCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'groups' AND column_name = 'nocodb_config_id'
        );
      `);
      
      if (!nocodbConfigIdCheck.rows[0]?.exists) {
        console.log('🔧 [MIGRATION] Ajout de la colonne nocodb_config_id...');
        await pool.query(`ALTER TABLE groups ADD COLUMN nocodb_config_id INTEGER REFERENCES nocodb_configs(id);`);
        console.log('✅ [MIGRATION] Colonne nocodb_config_id ajoutée');
      } else {
        console.log('✅ [MIGRATION] Colonne nocodb_config_id déjà présente');
      }
      
      // Vérifier et ajouter nocodb_table_id
      const nocodbTableIdCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'groups' AND column_name = 'nocodb_table_id'
        );
      `);
      
      if (!nocodbTableIdCheck.rows[0]?.exists) {
        console.log('🔧 [MIGRATION] Ajout de la colonne nocodb_table_id...');
        await pool.query(`ALTER TABLE groups ADD COLUMN nocodb_table_id VARCHAR(255);`);
        console.log('✅ [MIGRATION] Colonne nocodb_table_id ajoutée');
      } else {
        console.log('✅ [MIGRATION] Colonne nocodb_table_id déjà présente');
      }
      
      // Vérifier et ajouter nocodb_table_name
      const nocodbTableNameCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'groups' AND column_name = 'nocodb_table_name'
        );
      `);
      
      if (!nocodbTableNameCheck.rows[0]?.exists) {
        console.log('🔧 [MIGRATION] Ajout de la colonne nocodb_table_name...');
        await pool.query(`ALTER TABLE groups ADD COLUMN nocodb_table_name VARCHAR(255);`);
        console.log('✅ [MIGRATION] Colonne nocodb_table_name ajoutée');
      } else {
        console.log('✅ [MIGRATION] Colonne nocodb_table_name déjà présente');
      }
      
      // Vérifier et ajouter invoice_column_name
      const invoiceColumnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'groups' AND column_name = 'invoice_column_name'
        );
      `);
      
      if (!invoiceColumnCheck.rows[0]?.exists) {
        console.log('🔧 [MIGRATION] Ajout de la colonne invoice_column_name...');
        await pool.query(`ALTER TABLE groups ADD COLUMN invoice_column_name VARCHAR(255) DEFAULT 'RefFacture';`);
        console.log('✅ [MIGRATION] Colonne invoice_column_name ajoutée');
      } else {
        console.log('✅ [MIGRATION] Colonne invoice_column_name déjà présente');
      }
      
      console.log('✅ [MIGRATION] Migration automatique des colonnes terminée');
      
    } catch (migrationError) {
      console.warn('⚠️ [MIGRATION] Erreur lors de la migration automatique:', migrationError.message);
      // Ne pas faire échouer l'initialisation pour une erreur de migration
    }

    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log("✅ Database schema already exists");
    } else {
      console.error("❌ Error initializing database:", error);
      throw error;
    }
  }
}