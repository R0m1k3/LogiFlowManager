import { 
  type User,
  type Group,
  type Supplier,
  type Order,
  type Delivery,
  type UserGroup,
  type UpsertUser,
  type InsertGroup,
  type InsertSupplier,
  type InsertOrder,
  type InsertDelivery,
  type InsertUserGroup,
  type OrderWithRelations,
  type DeliveryWithRelations,
  type UserWithGroups,
} from "@shared/schema";

export interface IStorage {
  // User operations - supports both Replit Auth and local auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithGroups(id: string): Promise<UserWithGroups | undefined>;
  getUsers(): Promise<UserWithGroups[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Group operations
  getGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  
  // Order operations
  getOrders(groupIds?: number[]): Promise<OrderWithRelations[]>;
  getOrdersByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<OrderWithRelations[]>;
  getOrder(id: number): Promise<OrderWithRelations | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  
  // Delivery operations
  getDeliveries(groupIds?: number[]): Promise<DeliveryWithRelations[]>;
  getDeliveriesByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<DeliveryWithRelations[]>;
  getDelivery(id: number): Promise<DeliveryWithRelations | undefined>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery>;
  deleteDelivery(id: number): Promise<void>;
  validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void>;
  
  // User-Group operations
  getUserGroups(userId: string): Promise<UserGroup[]>;
  assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup>;
  removeUserFromGroup(userId: string, groupId: number): Promise<void>;
  
  // Statistics
  getMonthlyStats(year: number, month: number, groupIds?: number[]): Promise<{
    ordersCount: number;
    deliveriesCount: number;
    pendingOrdersCount: number;
    averageDeliveryTime: number;
    totalPalettes: number;
    totalPackages: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE id = $1 LIMIT 1
    `, [id]);
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE email = $1 LIMIT 1
    `, [email]);
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE username = $1 LIMIT 1
    `, [username]);
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    const { pool } = await import("./db.production.js");
    
    if (existingUser) {
      const result = await pool.query(`
        UPDATE users 
        SET name = $1, email = $2, username = $3, updated_at = $4
        WHERE id = $5
        RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
      `, [userData.name, userData.email, userData.username, new Date(), existingUser.id]);
      return result.rows[0];
    } else {
      const result = await pool.query(`
        INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
      `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, new Date(), new Date()]);
      return result.rows[0];
    }
  }

  async getUserWithGroups(id: string): Promise<UserWithGroups | undefined> {
    try {
      console.log(`🔍 Getting user with groups for ID: ${id}`);
      
      // Use raw SQL with pool.query to avoid Drizzle ORM issues
      const { pool } = await import("./db.production.js");
      
      // Get user info
      const userResult = await pool.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        WHERE id = $1
      `, [id]);

      if (userResult.rows.length === 0) {
        console.log(`❌ User not found: ${id}`);
        return undefined;
      }

      const user = userResult.rows[0];

      // Get user groups (no ug.id since table might not have it)
      const groupsResult = await pool.query(`
        SELECT ug.user_id, ug.group_id, ug.created_at as ug_created_at,
               g.id, g.name, g.color, g.created_at, g.updated_at
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = $1
      `, [id]);

      const userWithGroups: UserWithGroups = {
        ...user,
        userGroups: groupsResult.rows.map(row => ({
          id: `${row.user_id}-${row.group_id}`, // Composite ID
          userId: row.user_id,
          groupId: row.group_id,
          createdAt: row.ug_created_at,
          group: {
            id: row.id,
            name: row.name,
            color: row.color,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        })),
      };

      console.log(`✅ User with groups found:`, { 
        id: userWithGroups.id, 
        username: userWithGroups.username,
        groupCount: userWithGroups.userGroups.length 
      });
      
      return userWithGroups;
    } catch (error) {
      console.error("❌ Error processing user groups for", id, ":", error);
      throw error;
    }
  }

  async getUsers(): Promise<UserWithGroups[]> {
    console.log('🔍 Storage getUsers called');
    
    try {
      // Use raw SQL with pool.query to avoid Drizzle ORM issues
      const { pool } = await import("./db.production.js");
      
      // Get all users
      const usersResult = await pool.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `);
      
      console.log('✅ Basic users query returned:', usersResult.rows.length, 'users');
      
      if (usersResult.rows.length === 0) {
        console.log('❌ No users found in database');
        return [];
      }
      
      // Get all user groups in one query for efficiency (no ug.id)
      const allUserGroupsResult = await pool.query(`
        SELECT ug.user_id, ug.group_id, ug.created_at as ug_created_at,
               g.id, g.name, g.color, g.created_at, g.updated_at
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
      `);
      
      // Group the user groups by user_id for efficient lookup
      const userGroupsMap = new Map<string, any[]>();
      allUserGroupsResult.rows.forEach(row => {
        if (!userGroupsMap.has(row.user_id)) {
          userGroupsMap.set(row.user_id, []);
        }
        userGroupsMap.get(row.user_id)!.push({
          id: `${row.user_id}-${row.group_id}`, // Composite ID
          userId: row.user_id,
          groupId: row.group_id,
          createdAt: row.ug_created_at,
          group: {
            id: row.id,
            name: row.name,
            color: row.color,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        });
      });
      
      // Build the users with groups
      const usersWithGroups: UserWithGroups[] = usersResult.rows.map(user => {
        console.log('🔍 Processing user:', user.id, user.username);
        
        return {
          ...user,
          userGroups: userGroupsMap.get(user.id) || []
        };
      });
      
      console.log('✅ Users with groups processed:', usersWithGroups.length);
      return usersWithGroups;
    } catch (error) {
      console.error('❌ Error in getUsers:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }



  async createUser(userData: UpsertUser): Promise<User> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
    `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const { pool } = await import("./db.production.js");
    
    // Handle firstName/lastName to name conversion if needed
    let name = userData.name;
    if (!name && (userData as any).firstName && (userData as any).lastName) {
      name = `${(userData as any).firstName} ${(userData as any).lastName}`.trim();
    }
    
    console.log('🔍 Updating user with data:', { id, name, email: userData.email, username: userData.username });
    
    const result = await pool.query(`
      UPDATE users 
      SET name = COALESCE($1, name), email = COALESCE($2, email), username = COALESCE($3, username), 
          role = COALESCE($4, role), password = COALESCE($5, password), 
          password_changed = COALESCE($6, password_changed), updated_at = $7
      WHERE id = $8
      RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
    `, [name, userData.email, userData.username, userData.role, userData.password, userData.passwordChanged, new Date(), id]);
    
    console.log('✅ User updated:', result.rows[0]);
    return result.rows[0];
  }

  async deleteUser(id: string): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM user_groups WHERE user_id = $1`, [id]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async getGroups(): Promise<Group[]> {
    console.log('🔍 Storage getGroups called');
    
    try {
      // Raw SQL query to avoid Drizzle ORM issues
      const { pool } = await import("./db.production.js");
      const result = await pool.query(`
        SELECT id, name, color, created_at, updated_at 
        FROM groups 
        ORDER BY name
      `);
      
      console.log('✅ Groups query returned:', result.rows.length, 'groups');
      
      if (result.rows.length === 0) {
        console.log('❌ No groups found in database');
        return [];
      }
      
      const groups = result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        color: row.color as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
      }));
      
      console.log('✅ Groups found:', groups.map(g => ({ id: g.id, name: g.name })));
      
      return groups;
    } catch (error) {
      console.error('❌ Error in getGroups:', error);
      throw error;
    }
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    console.log('🔍 Storage createGroup called with:', group);
    
    try {
      const { pool } = await import("./db.production.js");
      const result = await pool.query(`
        INSERT INTO groups (name, color, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, color, created_at, updated_at
      `, [group.name, group.color, new Date(), new Date()]);
      console.log('✅ Group created in database:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating group in database:', error);
      throw error;
    }
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE groups 
      SET name = COALESCE($1, name), color = COALESCE($2, color), updated_at = $3
      WHERE id = $4
      RETURNING id, name, color, created_at, updated_at
    `, [group.name, group.color, new Date(), id]);
    return result.rows[0];
  }

  async deleteGroup(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM user_groups WHERE group_id = $1`, [id]);
    await pool.query(`DELETE FROM groups WHERE id = $1`, [id]);
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      SELECT id, name, contact, email, phone, created_at, updated_at
      FROM suppliers 
      ORDER BY name
    `);
    return result.rows;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact, email, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, contact, email, phone, created_at, updated_at
    `, [supplier.name, supplier.contact, supplier.email, supplier.phone, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE suppliers 
      SET name = COALESCE($1, name), contact = COALESCE($2, contact), 
          email = COALESCE($3, email), phone = COALESCE($4, phone), updated_at = $5
      WHERE id = $6
      RETURNING id, name, contact, email, phone, created_at, updated_at
    `, [supplier.name, supplier.contact, supplier.email, supplier.phone, new Date(), id]);
    return result.rows[0];
  }

  async deleteSupplier(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
  }

  async getOrders(groupIds?: number[]): Promise<OrderWithRelations[]> {
    console.log('🔍 Storage getOrders called with groupIds:', groupIds);
    
    try {
      // Use raw SQL to avoid complex object structure issues
      let sqlQuery = `
        SELECT 
          o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
          s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
          s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
          g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
          u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
          u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
        FROM orders o
        INNER JOIN suppliers s ON o.supplier_id = s.id
        INNER JOIN groups g ON o.group_id = g.id
        INNER JOIN users u ON o.created_by = u.id
      `;
      
      const params = [];
      if (groupIds && groupIds.length > 0) {
        sqlQuery += ` WHERE o.group_id = ANY($1)`;
        params.push(groupIds);
      }
      
      sqlQuery += ` ORDER BY o.created_at DESC`;
      
      const { pool } = await import("./db.production.js");
      const results = params.length > 0 
        ? await pool.query(sqlQuery, params)
        : await pool.query(sqlQuery);
      
      const orders = results.rows.map(row => ({
        id: row.id as number,
        supplierId: row.supplier_id as number,
        groupId: row.group_id as number,
        plannedDate: row.planned_date as string,
        status: row.status as string,
        comments: row.comments as string,
        createdBy: row.created_by as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        supplier: {
          id: row.supplier_id as number,
          name: row.supplier_name as string,
          contact: row.supplier_contact as string,
          email: row.supplier_email as string,
          phone: row.supplier_phone as string,
          createdAt: new Date(row.supplier_created_at as string),
          updatedAt: new Date(row.supplier_updated_at as string),
        },
        group: {
          id: row.group_id as number,
          name: row.group_name as string,
          color: row.group_color as string,
          createdAt: new Date(row.group_created_at as string),
          updatedAt: new Date(row.group_updated_at as string),
        },
        creator: {
          id: row.creator_id as string,
          username: row.creator_username as string,
          email: row.creator_email as string,
          name: row.creator_name as string,
          role: row.creator_role as 'admin' | 'manager' | 'employee',
          password: row.creator_password as string,
          passwordChanged: row.creator_password_changed as boolean,
          createdAt: new Date(row.creator_created_at as string),
          updatedAt: new Date(row.creator_updated_at as string),
        },
        deliveries: []
      }));
      
      console.log('✅ Orders query returned:', orders.length, 'orders');
      return orders as OrderWithRelations[];
      
    } catch (error) {
      console.error('❌ Error in getOrders:', error);
      throw error;
    }
  }

  async getOrdersByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<OrderWithRelations[]> {
    const { pool } = await import("./db.production.js");
    
    let sqlQuery = `
      SELECT 
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM orders o
      INNER JOIN suppliers s ON o.supplier_id = s.id
      INNER JOIN groups g ON o.group_id = g.id
      INNER JOIN users u ON o.created_by = u.id
      WHERE o.planned_date >= $1 AND o.planned_date <= $2
    `;
    
    const params = [startDate, endDate];
    if (groupIds && groupIds.length > 0) {
      sqlQuery += ` AND o.group_id = ANY($3)`;
      params.push(groupIds);
    }
    
    sqlQuery += ` ORDER BY o.created_at DESC`;
    
    const results = await pool.query(sqlQuery, params);

    return results.rows.map(row => ({
      id: row.id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      plannedDate: row.planned_date as string,
      status: row.status as string,
      comments: row.comments as string,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
        email: row.supplier_email as string,
        phone: row.supplier_phone as string,
        createdAt: new Date(row.supplier_created_at as string),
        updatedAt: new Date(row.supplier_updated_at as string),
      },
      group: {
        id: row.group_id as number,
        name: row.group_name as string,
        color: row.group_color as string,
        createdAt: new Date(row.group_created_at as string),
        updatedAt: new Date(row.group_updated_at as string),
      },
      creator: {
        id: row.creator_id as string,
        username: row.creator_username as string,
        email: row.creator_email as string,
        name: row.creator_name as string,
        role: row.creator_role as 'admin' | 'manager' | 'employee',
        password: row.creator_password as string,
        passwordChanged: row.creator_password_changed as boolean,
        createdAt: new Date(row.creator_created_at as string),
        updatedAt: new Date(row.creator_updated_at as string),
      },
      deliveries: []
    })) as OrderWithRelations[];
  }

  async getOrder(id: number): Promise<OrderWithRelations | undefined> {
    const { pool } = await import("./db.production.js");
    
    const result = await pool.query(`
      SELECT 
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM orders o
      INNER JOIN suppliers s ON o.supplier_id = s.id
      INNER JOIN groups g ON o.group_id = g.id
      INNER JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      id: row.id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      plannedDate: row.planned_date as string,
      status: row.status as string,
      comments: row.comments as string,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
        email: row.supplier_email as string,
        phone: row.supplier_phone as string,
        createdAt: new Date(row.supplier_created_at as string),
        updatedAt: new Date(row.supplier_updated_at as string),
      },
      group: {
        id: row.group_id as number,
        name: row.group_name as string,
        color: row.group_color as string,
        createdAt: new Date(row.group_created_at as string),
        updatedAt: new Date(row.group_updated_at as string),
      },
      creator: {
        id: row.creator_id as string,
        username: row.creator_username as string,
        email: row.creator_email as string,
        name: row.creator_name as string,
        role: row.creator_role as 'admin' | 'manager' | 'employee',
        password: row.creator_password as string,
        passwordChanged: row.creator_password_changed as boolean,
        createdAt: new Date(row.creator_created_at as string),
        updatedAt: new Date(row.creator_updated_at as string),
      },
      deliveries: []
    } as OrderWithRelations;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO orders (supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at
    `, [order.supplierId, order.groupId, order.plannedDate, order.status, order.comments, order.createdBy, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE orders 
      SET supplier_id = COALESCE($1, supplier_id), group_id = COALESCE($2, group_id), 
          planned_date = COALESCE($3, planned_date), status = COALESCE($4, status), 
          comments = COALESCE($5, comments), updated_at = $6
      WHERE id = $7
      RETURNING id, supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at
    `, [order.supplierId, order.groupId, order.plannedDate, order.status, order.comments, new Date(), id]);
    return result.rows[0];
  }

  async deleteOrder(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM orders WHERE id = $1`, [id]);
  }

  async getDeliveries(groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    const { pool } = await import("./db.production.js");
    
    let sqlQuery = `
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
    `;
    
    const params = [];
    if (groupIds && groupIds.length > 0) {
      sqlQuery += ` WHERE d.group_id = ANY($1)`;
      params.push(groupIds);
    }
    
    sqlQuery += ` ORDER BY d.created_at DESC`;
    
    const results = params.length > 0 
      ? await pool.query(sqlQuery, params)
      : await pool.query(sqlQuery);

    return results.rows.map(row => ({
      id: row.id as number,
      orderId: row.order_id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      scheduledDate: row.scheduled_date as string,
      quantity: row.quantity as number,
      unit: row.unit as string,
      status: row.status as string,
      notes: row.notes as string,
      blNumber: row.bl_number as string,
      blAmount: row.bl_amount as number,
      invoiceReference: row.invoice_reference as string,
      invoiceAmount: row.invoice_amount as number,
      reconciled: row.reconciled as boolean,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
        email: row.supplier_email as string,
        phone: row.supplier_phone as string,
        createdAt: new Date(row.supplier_created_at as string),
        updatedAt: new Date(row.supplier_updated_at as string),
      },
      group: {
        id: row.group_id as number,
        name: row.group_name as string,
        color: row.group_color as string,
        createdAt: new Date(row.group_created_at as string),
        updatedAt: new Date(row.group_updated_at as string),
      },
      creator: {
        id: row.creator_id as string,
        username: row.creator_username as string,
        email: row.creator_email as string,
        name: row.creator_name as string,
        role: row.creator_role as 'admin' | 'manager' | 'employee',
        password: row.creator_password as string,
        passwordChanged: row.creator_password_changed as boolean,
        createdAt: new Date(row.creator_created_at as string),
        updatedAt: new Date(row.creator_updated_at as string),
      },
      order: null
    })) as DeliveryWithRelations[];
  }

  async getDeliveriesByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    const { pool } = await import("./db.production.js");
    
    let sqlQuery = `
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      WHERE d.scheduled_date >= $1 AND d.scheduled_date <= $2
    `;
    
    const params = [startDate, endDate];
    if (groupIds && groupIds.length > 0) {
      sqlQuery += ` AND d.group_id = ANY($3)`;
      params.push(groupIds);
    }
    
    sqlQuery += ` ORDER BY d.created_at DESC`;
    
    const results = await pool.query(sqlQuery, params);

    return results.rows.map(row => ({
      id: row.id as number,
      orderId: row.order_id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      scheduledDate: row.scheduled_date as string,
      quantity: row.quantity as number,
      unit: row.unit as string,
      status: row.status as string,
      notes: row.notes as string,
      blNumber: row.bl_number as string,
      blAmount: row.bl_amount as number,
      invoiceReference: row.invoice_reference as string,
      invoiceAmount: row.invoice_amount as number,
      reconciled: row.reconciled as boolean,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
        email: row.supplier_email as string,
        phone: row.supplier_phone as string,
        createdAt: new Date(row.supplier_created_at as string),
        updatedAt: new Date(row.supplier_updated_at as string),
      },
      group: {
        id: row.group_id as number,
        name: row.group_name as string,
        color: row.group_color as string,
        createdAt: new Date(row.group_created_at as string),
        updatedAt: new Date(row.group_updated_at as string),
      },
      creator: {
        id: row.creator_id as string,
        username: row.creator_username as string,
        email: row.creator_email as string,
        name: row.creator_name as string,
        role: row.creator_role as 'admin' | 'manager' | 'employee',
        password: row.creator_password as string,
        passwordChanged: row.creator_password_changed as boolean,
        createdAt: new Date(row.creator_created_at as string),
        updatedAt: new Date(row.creator_updated_at as string),
      },
      order: null
    })) as DeliveryWithRelations[];
  }

  async getDelivery(id: number): Promise<DeliveryWithRelations | undefined> {
    const { pool } = await import("./db.production.js");
    
    const result = await pool.query(`
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      id: row.id as number,
      orderId: row.order_id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      scheduledDate: row.scheduled_date as string,
      quantity: row.quantity as number,
      unit: row.unit as string,
      status: row.status as string,
      notes: row.notes as string,
      blNumber: row.bl_number as string,
      blAmount: row.bl_amount as number,
      invoiceReference: row.invoice_reference as string,
      invoiceAmount: row.invoice_amount as number,
      reconciled: row.reconciled as boolean,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
        email: row.supplier_email as string,
        phone: row.supplier_phone as string,
        createdAt: new Date(row.supplier_created_at as string),
        updatedAt: new Date(row.supplier_updated_at as string),
      },
      group: {
        id: row.group_id as number,
        name: row.group_name as string,
        color: row.group_color as string,
        createdAt: new Date(row.group_created_at as string),
        updatedAt: new Date(row.group_updated_at as string),
      },
      creator: {
        id: row.creator_id as string,
        username: row.creator_username as string,
        email: row.creator_email as string,
        name: row.creator_name as string,
        role: row.creator_role as 'admin' | 'manager' | 'employee',
        password: row.creator_password as string,
        passwordChanged: row.creator_password_changed as boolean,
        createdAt: new Date(row.creator_created_at as string),
        updatedAt: new Date(row.creator_updated_at as string),
      },
      order: null
    } as DeliveryWithRelations;
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO deliveries (order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, bl_number, bl_amount, 
                invoice_reference, invoice_amount, reconciled, created_by, created_at, updated_at
    `, [delivery.orderId, delivery.supplierId, delivery.groupId, delivery.scheduledDate, delivery.quantity, delivery.unit, 
        delivery.status, delivery.notes, delivery.createdBy, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE deliveries 
      SET order_id = COALESCE($1, order_id), supplier_id = COALESCE($2, supplier_id), group_id = COALESCE($3, group_id),
          scheduled_date = COALESCE($4, scheduled_date), quantity = COALESCE($5, quantity), unit = COALESCE($6, unit),
          status = COALESCE($7, status), notes = COALESCE($8, notes), updated_at = $9
      WHERE id = $10
      RETURNING id, order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, bl_number, bl_amount, 
                invoice_reference, invoice_amount, reconciled, created_by, created_at, updated_at
    `, [delivery.orderId, delivery.supplierId, delivery.groupId, delivery.scheduledDate, delivery.quantity, delivery.unit,
        delivery.status, delivery.notes, new Date(), id]);
    return result.rows[0];
  }

  async deleteDelivery(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM deliveries WHERE id = $1`, [id]);
  }

  async validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`
      UPDATE deliveries 
      SET status = 'delivered', bl_number = $1, bl_amount = $2, updated_at = $3
      WHERE id = $4
    `, [blData?.blNumber, blData?.blAmount, new Date(), id]);
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      SELECT user_id, group_id, created_at
      FROM user_groups 
      WHERE user_id = $1
    `, [userId]);
    return result.rows.map(row => ({
      id: `${row.user_id}-${row.group_id}`,
      userId: row.user_id,
      groupId: row.group_id,
      createdAt: row.created_at
    }));
  }

  async assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO user_groups (user_id, group_id, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, group_id) DO NOTHING
      RETURNING user_id, group_id, created_at
    `, [userGroup.userId, userGroup.groupId, new Date()]);
    
    if (result.rows.length === 0) {
      // If conflict, get existing record
      const existing = await pool.query(`
        SELECT user_id, group_id, created_at
        FROM user_groups 
        WHERE user_id = $1 AND group_id = $2
      `, [userGroup.userId, userGroup.groupId]);
      const row = existing.rows[0];
      return {
        id: `${row.user_id}-${row.group_id}`,
        userId: row.user_id,
        groupId: row.group_id,
        createdAt: row.created_at
      };
    }
    
    const row = result.rows[0];
    return {
      id: `${row.user_id}-${row.group_id}`,
      userId: row.user_id,
      groupId: row.group_id,
      createdAt: row.created_at
    };
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`
      DELETE FROM user_groups 
      WHERE user_id = $1 AND group_id = $2
    `, [userId, groupId]);
  }

  async getMonthlyStats(year: number, month: number, groupIds?: number[]): Promise<{
    ordersCount: number;
    deliveriesCount: number;
    pendingOrdersCount: number;
    averageDeliveryTime: number;
    totalPalettes: number;
    totalPackages: number;
  }> {
    const { pool } = await import("./db.production.js");
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    let ordersCountQuery = `SELECT COUNT(*) as count FROM orders WHERE planned_date >= $1 AND planned_date <= $2`;
    let deliveriesCountQuery = `SELECT COUNT(*) as count FROM deliveries WHERE scheduled_date >= $1 AND scheduled_date <= $2`;
    let pendingOrdersCountQuery = `SELECT COUNT(*) as count FROM orders WHERE planned_date >= $1 AND planned_date <= $2 AND status = 'pending'`;
    
    const params = [startDate, endDate];
    
    if (groupIds && groupIds.length > 0) {
      ordersCountQuery += ` AND group_id = ANY($3)`;
      deliveriesCountQuery += ` AND group_id = ANY($3)`;
      pendingOrdersCountQuery += ` AND group_id = ANY($3)`;
      params.push(groupIds);
    }

    const [ordersResult, deliveriesResult, pendingOrdersResult] = await Promise.all([
      pool.query(ordersCountQuery, params),
      pool.query(deliveriesCountQuery, params),
      pool.query(pendingOrdersCountQuery, params)
    ]);

    return {
      ordersCount: Number(ordersResult.rows[0]?.count || 0),
      deliveriesCount: Number(deliveriesResult.rows[0]?.count || 0),
      pendingOrdersCount: Number(pendingOrdersResult.rows[0]?.count || 0),
      averageDeliveryTime: 0,
      totalPalettes: 0,
      totalPackages: 0,
    };
  }
}

export const storage = new DatabaseStorage();