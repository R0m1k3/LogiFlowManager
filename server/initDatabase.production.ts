import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function initDatabase() {
  try {
    console.log('🔧 Initializing production database...');
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    
    // Check if tables exist, if not create them (first time setup)
    await createTablesIfNotExist();
    
    // Run incremental migrations to update existing tables
    await runMigrations();
    
    // Create default admin user only if it doesn't exist
    await createDefaultAdmin();
    
    console.log('✅ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTablesIfNotExist() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      profile_image_url TEXT,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'employee',
      password_changed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createGroupsTable = `
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color VARCHAR(20) DEFAULT '#1976D2',
      nocodb_config_id INTEGER,
      nocodb_table_id VARCHAR(255),
      nocodb_table_name VARCHAR(255),
      invoice_column_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSuppliersTable = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(255),
      phone VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      planned_date DATE NOT NULL,
      quantity INTEGER,
      unit VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'delivered')),
      notes TEXT,
      created_by VARCHAR(255) REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createDeliveriesTable = `
    CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      scheduled_date DATE NOT NULL,
      delivered_date TIMESTAMP,
      quantity INTEGER NOT NULL,
      unit VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
      notes TEXT,
      bl_number VARCHAR(255),
      bl_amount DECIMAL(10,2),
      invoice_reference VARCHAR(255),
      invoice_amount DECIMAL(10,2),
      reconciled BOOLEAN DEFAULT false,
      validated_at TIMESTAMP,
      created_by VARCHAR(255) REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUserGroupsTable = `
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, group_id)
    );
  `;

  const createSessionTable = `
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
  `;

  const createPublicitiesTable = `
    CREATE TABLE IF NOT EXISTS publicities (
      id SERIAL PRIMARY KEY,
      pub_number VARCHAR(255) NOT NULL,
      designation TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      year INTEGER NOT NULL,
      created_by VARCHAR(255) REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPublicityParticipationsTable = `
    CREATE TABLE IF NOT EXISTS publicity_participations (
      publicity_id INTEGER REFERENCES publicities(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (publicity_id, group_id)
    );
  `;

  const createRolesTable = `
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      is_system BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPermissionsTable = `
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      category VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createRolePermissionsTable = `
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );
  `;

  const createNocodbConfigTable = `
    CREATE TABLE IF NOT EXISTS nocodb_config (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      base_url VARCHAR(255) NOT NULL,
      project_id VARCHAR(255) NOT NULL,
      table_id VARCHAR(255) NOT NULL,
      table_name VARCHAR(255) NOT NULL,
      invoice_column_name VARCHAR(255) NOT NULL,
      api_token TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by VARCHAR(255) REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCustomerOrdersTable = `
    CREATE TABLE IF NOT EXISTS customer_orders (
      id SERIAL PRIMARY KEY,
      order_taker VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(255),
      product_designation TEXT NOT NULL,
      product_reference VARCHAR(255),
      gencode VARCHAR(255),
      quantity INTEGER DEFAULT 1,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      status VARCHAR(100) DEFAULT 'En attente de Commande',
      deposit DECIMAL(10,2) DEFAULT 0.00,
      is_promotional_price BOOLEAN DEFAULT false,
      customer_notified BOOLEAN DEFAULT false,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      created_by VARCHAR(255) REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const tables = [
    createUsersTable,
    createGroupsTable,
    createSuppliersTable,
    createOrdersTable,
    createDeliveriesTable,
    createUserGroupsTable,
    createSessionTable,
    createPublicitiesTable,
    createPublicityParticipationsTable,
    createRolesTable,
    createPermissionsTable,
    createRolePermissionsTable,
    createNocodbConfigTable,
    createCustomerOrdersTable
  ];

  for (const table of tables) {
    await pool.query(table);
  }

  console.log('✅ All tables verified/created successfully');
}

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Migration 1: Add missing columns to existing tables
    await addMissingColumns();
    
    // Migration 2: Update constraints
    await updateConstraints();
    
    // Migration 3: Create new tables for roles/permissions if they don't exist
    await createRolesTables();
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Don't throw error, continue with existing tables
  }
}

async function addMissingColumns() {
  try {
    // Check and add delivered_date column to deliveries
    const deliveredDateExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'deliveries' AND column_name = 'delivered_date'
    `);
    
    if (deliveredDateExists.rows.length === 0) {
      await pool.query('ALTER TABLE deliveries ADD COLUMN delivered_date TIMESTAMP');
      console.log('✅ Added delivered_date column to deliveries');
    }

    // Check and add validated_at column to deliveries
    const validatedAtExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'deliveries' AND column_name = 'validated_at'
    `);
    
    if (validatedAtExists.rows.length === 0) {
      await pool.query('ALTER TABLE deliveries ADD COLUMN validated_at TIMESTAMP');
      console.log('✅ Added validated_at column to deliveries');
    }

    // Check and add name column to users
    const nameExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    
    if (nameExists.rows.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN name VARCHAR(255)');
      // Populate with existing data
      await pool.query(`
        UPDATE users SET name = COALESCE(first_name || ' ' || last_name, username, email) 
        WHERE name IS NULL
      `);
      console.log('✅ Added name column to users and populated with existing data');
    }

    // Check and add quantity column to customer_orders
    const quantityExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customer_orders' AND column_name = 'quantity'
    `);
    
    if (quantityExists.rows.length === 0) {
      await pool.query('ALTER TABLE customer_orders ADD COLUMN quantity INTEGER DEFAULT 1');
      console.log('✅ Added quantity column to customer_orders');
    }

    // Check and add quantity column to orders
    const ordersQuantityExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'quantity'
    `);
    
    if (ordersQuantityExists.rows.length === 0) {
      await pool.query('ALTER TABLE orders ADD COLUMN quantity INTEGER');
      console.log('✅ Added quantity column to orders');
    }

    // Check and add unit column to orders
    const ordersUnitExists = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'unit'
    `);
    
    if (ordersUnitExists.rows.length === 0) {
      await pool.query('ALTER TABLE orders ADD COLUMN unit VARCHAR(50)');
      console.log('✅ Added unit column to orders');
    }

  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
  }
}

async function updateConstraints() {
  try {
    // Check if orders_status_check constraint exists and needs updating
    const constraintExists = await pool.query(`
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'orders_status_check'
    `);
    
    if (constraintExists.rows.length > 0) {
      // Drop old constraint
      await pool.query('ALTER TABLE orders DROP CONSTRAINT orders_status_check');
      console.log('✅ Removed old orders_status_check constraint');
    }
    
    // Add updated constraint
    await pool.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'planned', 'delivered'))
    `);
    console.log('✅ Added updated orders_status_check constraint');
    
  } catch (error) {
    console.error('❌ Error updating constraints:', error);
  }
}

async function createRolesTables() {
  try {
    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    console.log('✅ Roles and permissions tables verified/created');
  } catch (error) {
    console.error('❌ Error creating roles tables:', error);
  }
}

async function createDefaultAdmin() {
  try {
    // Check if admin user exists
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length === 0) {
      // Import hash function without bcrypt
      const { hashPassword } = await import('./auth-utils.production.js');
      const hashedPassword = await hashPassword('admin');
      
      await pool.query(`
        INSERT INTO users (id, username, email, name, first_name, last_name, password, role, password_changed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'admin_local',
        'admin',
        'admin@logiflow.com',
        'Administrateur',
        'Admin',
        'LogiFlow',
        hashedPassword,
        'admin',
        false
      ]);

      console.log('✅ Default admin user created: admin/admin');
    } else {
      // Admin exists but update password with new hash format if needed
      const { hashPassword } = await import('./auth-utils.production.js');
      const newHashedPassword = await hashPassword('admin');
      
      await pool.query(
        'UPDATE users SET password = $1, password_changed = false WHERE username = $2',
        [newHashedPassword, 'admin']
      );
      
      console.log('✅ Admin user password updated with new hash format');
    }
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  }
}

export { pool };