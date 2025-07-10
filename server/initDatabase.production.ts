import { db } from "./db.production";

export async function initializeDatabase() {
  console.log("🔄 Initializing database schema...");
  
  try {
    // Drop and recreate users table to ensure correct schema
    await db.execute(`DROP TABLE IF EXISTS users CASCADE`);
    await db.execute(`
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY NOT NULL,
        username VARCHAR UNIQUE,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        password VARCHAR,
        role VARCHAR NOT NULL DEFAULT 'employee',
        password_changed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create groups table  
    await db.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        color VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create suppliers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        contact VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        planned_date DATE NOT NULL,
        quantity INTEGER,
        unit VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        comments TEXT,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deliveries table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        planned_date DATE NOT NULL,
        delivered_date TIMESTAMP,
        quantity INTEGER NOT NULL,
        unit VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'planned',
        comments TEXT,
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

    // Create user_groups table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_groups (
        user_id VARCHAR NOT NULL,
        group_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session table with primary key
    await db.execute(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR PRIMARY KEY NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);

    // Insert default groups
    await db.execute(`
      INSERT INTO groups (id, name, color) VALUES 
        (1, 'Frouard', '#1976D2'),
        (2, 'Nancy', '#388E3C'),
        (3, 'Metz', '#F57C00')
      ON CONFLICT (id) DO NOTHING
    `);

    // Insert default suppliers
    await db.execute(`
      INSERT INTO suppliers (id, name, contact, phone) VALUES 
        (1, 'Fournisseur Test', 'Contact Principal', '03.83.00.00.00'),
        (2, 'Logistique Pro', 'Service Commercial', '03.87.11.22.33')
      ON CONFLICT (id) DO NOTHING
    `);

    // Reset sequences
    await db.execute(`SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups))`);
    await db.execute(`SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers))`);

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