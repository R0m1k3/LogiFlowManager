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

    // Note: No default test data inserted in production
    // Groups and suppliers will be created by administrators as needed
    console.log("✅ Database schema ready - no test data inserted");

    // Reset sequences using raw SQL (only if data exists)
    console.log("🔧 Resetting sequences...");
    await pool.query(`SELECT setval('groups_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM groups), 1))`);
    await pool.query(`SELECT setval('suppliers_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM suppliers), 1))`);

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