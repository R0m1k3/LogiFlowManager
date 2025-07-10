import { db } from "./db.production";

export async function initializeDatabase() {
  console.log("🔄 Initializing database schema...");
  
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
        password TEXT NOT NULL,
        password_changed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create groups table  
    await db.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#1976D2',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create suppliers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        contact TEXT,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        planned_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'received')),
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deliveries table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        scheduled_date TEXT NOT NULL,
        quantity INTEGER,
        unit TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
        notes TEXT,
        bl_number TEXT,
        bl_amount DECIMAL(10,2),
        invoice_reference TEXT,
        invoice_amount DECIMAL(10,2),
        reconciled BOOLEAN DEFAULT FALSE,
        created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_groups table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, group_id)
      )
    `);

    // Create session table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    await db.execute(`
      ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
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
      INSERT INTO suppliers (id, name, contact, email, phone) VALUES 
        (1, 'Fournisseur Test', 'Contact Principal', 'contact@fournisseur.fr', '03.83.00.00.00'),
        (2, 'Logistique Pro', 'Service Commercial', 'commercial@logistique-pro.fr', '03.87.11.22.33')
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