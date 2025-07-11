import { pool } from "./db.production.js";
import type { IStorage, User, UpsertUser, UserWithGroups, Group, InsertGroup, Supplier, InsertSupplier, Order, InsertOrder, OrderWithRelations, Delivery, InsertDelivery, DeliveryWithRelations, UserGroup, InsertUserGroup } from "./storage.js";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { pool } = await import("./db.production.js");
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      const result = await pool.query(`
        UPDATE users 
        SET username = $1, email = $2, name = $3, role = $4, updated_at = $5
        WHERE id = $6
        RETURNING *
      `, [userData.username, userData.email, userData.name, userData.role, new Date(), existingUser.id]);
      return result.rows[0];
    } else {
      const result = await pool.query(`
        INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, new Date(), new Date()]);
      return result.rows[0];
    }
  }

  async getUserWithGroups(id: string): Promise<UserWithGroups | undefined> {
    try {
      const { pool } = await import("./db.production.js");
      
      // Simple query for user
      const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
      if (userResult.rows.length === 0) return undefined;
      
      const user = userResult.rows[0];
      
      // Separate query for user groups
      const groupsResult = await pool.query(`
        SELECT ug.user_id, ug.group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at
        FROM user_groups ug
        INNER JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = $1
      `, [id]);
      
      const userGroups = groupsResult.rows.map(row => ({
        userId: row.user_id,
        groupId: row.group_id,
        assignedAt: new Date(),
        group: {
          id: row.group_id,
          name: row.group_name,
          color: row.group_color,
          createdAt: new Date(row.group_created_at),
          updatedAt: new Date(row.group_updated_at),
        }
      }));

      return {
        ...user,
        userGroups
      };
    } catch (error) {
      console.error('❌ Error in getUserWithGroups:', error);
      throw error;
    }
  }

  async getUsers(): Promise<UserWithGroups[]> {
    try {
      const { pool } = await import("./db.production.js");
      
      // Get all users
      const usersResult = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
      const users = usersResult.rows;
      
      // Get all user groups
      const groupsResult = await pool.query(`
        SELECT ug.user_id, ug.group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at
        FROM user_groups ug
        INNER JOIN groups g ON ug.group_id = g.id
      `);
      
      // Map groups by user ID for efficiency
      const groupsByUser = new Map<string, any[]>();
      groupsResult.rows.forEach(row => {
        if (!groupsByUser.has(row.user_id)) {
          groupsByUser.set(row.user_id, []);
        }
        groupsByUser.get(row.user_id)!.push({
          userId: row.user_id,
          groupId: row.group_id,
          assignedAt: new Date(),
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at),
          }
        });
      });
      
      return users.map(user => ({
        ...user,
        userGroups: groupsByUser.get(user.id) || []
      }));
    } catch (error) {
      console.error('❌ Error in getUsers:', error);
      throw error;
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE users 
      SET username = COALESCE($1, username), email = COALESCE($2, email), 
          name = COALESCE($3, name), role = COALESCE($4, role), 
          password = COALESCE($5, password), password_changed = COALESCE($6, password_changed), 
          updated_at = $7
      WHERE id = $8
      RETURNING *
    `, [userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, new Date(), id]);
    return result.rows[0];
  }

  async deleteUser(id: string): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async getGroups(): Promise<Group[]> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM groups ORDER BY name`);
    return result.rows;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO groups (name, color, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [group.name, group.color, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE groups 
      SET name = COALESCE($1, name), color = COALESCE($2, color), updated_at = $3
      WHERE id = $4
      RETURNING *
    `, [group.name, group.color, new Date(), id]);
    return result.rows[0];
  }

  async deleteGroup(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM groups WHERE id = $1`, [id]);
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM suppliers ORDER BY name`);
    return result.rows;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [supplier.name, supplier.contact, supplier.phone, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE suppliers 
      SET name = COALESCE($1, name), contact = COALESCE($2, contact), 
          phone = COALESCE($3, phone), updated_at = $4
      WHERE id = $5
      RETURNING *
    `, [supplier.name, supplier.contact, supplier.phone, new Date(), id]);
    return result.rows[0];
  }

  async deleteSupplier(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
  }

  async getOrders(groupIds?: number[]): Promise<OrderWithRelations[]> {
    try {
      const { pool } = await import("./db.production.js");
      
      let sqlQuery = `
        SELECT 
          o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.notes, o.created_by, o.created_at, o.updated_at,
          s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
          s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
          g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
          u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
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
      
      const results = params.length > 0 
        ? await pool.query(sqlQuery, params)
        : await pool.query(sqlQuery);
      
      const orders = results.rows.map(row => ({
        id: row.id as number,
        supplierId: row.supplier_id as number,
        groupId: row.group_id as number,
        plannedDate: row.planned_date as string,
        status: row.status as string,
        notes: row.notes as string,
        createdBy: row.created_by as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        supplier: {
          id: row.supplier_id as number,
          name: row.supplier_name as string,
          contact: row.supplier_contact as string,
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
          id: row.created_by as string,
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
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.notes, o.created_by, o.created_at, o.updated_at,
        s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
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
      notes: row.notes as string,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
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
        id: row.created_by as string,
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
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.notes, o.created_by, o.created_at, o.updated_at,
        s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM orders o
      INNER JOIN suppliers s ON o.supplier_id = s.id
      INNER JOIN groups g ON o.group_id = g.id
      INNER JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      supplierId: row.supplier_id as number,
      groupId: row.group_id as number,
      plannedDate: row.planned_date as string,
      status: row.status as string,
      notes: row.notes as string,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      supplier: {
        id: row.supplier_id as number,
        name: row.supplier_name as string,
        contact: row.supplier_contact as string,
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
        id: row.created_by as string,
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
      INSERT INTO orders (supplier_id, group_id, planned_date, status, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [order.supplierId, order.groupId, order.plannedDate, order.status || 'pending', order.notes, order.createdBy, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      UPDATE orders 
      SET supplier_id = COALESCE($1, supplier_id), group_id = COALESCE($2, group_id), 
          planned_date = COALESCE($3, planned_date), status = COALESCE($4, status), 
          notes = COALESCE($5, notes), updated_at = $6
      WHERE id = $7
      RETURNING *
    `, [order.supplierId, order.groupId, order.plannedDate, order.status, order.notes, new Date(), id]);
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
        s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at,
        o.id as order_id_rel, o.planned_date as order_planned_date, o.status as order_status, o.notes as order_notes
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
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
        id: row.created_by as string,
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
        s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
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
        id: row.created_by as string,
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
        s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
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
        id: row.created_by as string,
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
      RETURNING *
    `, [delivery.orderId, delivery.supplierId, delivery.groupId, delivery.scheduledDate, delivery.quantity, delivery.unit, delivery.status || 'planned', delivery.notes, delivery.createdBy, new Date(), new Date()]);
    return result.rows[0];
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const { pool } = await import("./db.production.js");
    
    // Construire la requête dynamiquement selon les champs fournis
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (delivery.orderId !== undefined) {
      fields.push(`order_id = $${paramIndex++}`);
      values.push(delivery.orderId);
    }
    if (delivery.supplierId !== undefined) {
      fields.push(`supplier_id = $${paramIndex++}`);
      values.push(delivery.supplierId);
    }
    if (delivery.groupId !== undefined) {
      fields.push(`group_id = $${paramIndex++}`);
      values.push(delivery.groupId);
    }
    if (delivery.scheduledDate !== undefined) {
      fields.push(`scheduled_date = $${paramIndex++}`);
      values.push(delivery.scheduledDate);
    }
    if (delivery.quantity !== undefined) {
      fields.push(`quantity = $${paramIndex++}`);
      values.push(delivery.quantity);
    }
    if (delivery.unit !== undefined) {
      fields.push(`unit = $${paramIndex++}`);
      values.push(delivery.unit);
    }
    if (delivery.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(delivery.status);
    }
    if (delivery.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(delivery.notes);
    }
    // Champs BL et facture
    if ((delivery as any).blNumber !== undefined) {
      fields.push(`bl_number = $${paramIndex++}`);
      values.push((delivery as any).blNumber);
    }
    if ((delivery as any).blAmount !== undefined) {
      fields.push(`bl_amount = $${paramIndex++}`);
      values.push((delivery as any).blAmount);
    }
    if ((delivery as any).invoiceReference !== undefined) {
      fields.push(`invoice_reference = $${paramIndex++}`);
      values.push((delivery as any).invoiceReference);
    }
    if ((delivery as any).invoiceAmount !== undefined) {
      fields.push(`invoice_amount = $${paramIndex++}`);
      values.push((delivery as any).invoiceAmount);
    }
    if ((delivery as any).reconciled !== undefined) {
      fields.push(`reconciled = $${paramIndex++}`);
      values.push((delivery as any).reconciled);
    }
    
    // Toujours mettre à jour updated_at
    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    
    // Ajouter l'ID en dernière position
    values.push(id);
    
    const query = `
      UPDATE deliveries 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    console.log('🔄 updateDelivery SQL:', query);
    console.log('🔄 updateDelivery VALUES:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteDelivery(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM deliveries WHERE id = $1`, [id]);
  }

  async validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void> {
    const { pool } = await import("./db.production.js");
    if (blData) {
      await pool.query(`
        UPDATE deliveries 
        SET status = 'delivered', bl_number = $1, bl_amount = $2, updated_at = $3
        WHERE id = $4
      `, [blData.blNumber, blData.blAmount, new Date(), id]);
    } else {
      await pool.query(`
        UPDATE deliveries 
        SET status = 'delivered', updated_at = $1
        WHERE id = $2
      `, [new Date(), id]);
    }
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`SELECT * FROM user_groups WHERE user_id = $1`, [userId]);
    return result.rows;
  }

  async assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO user_groups (user_id, group_id)
      VALUES ($1, $2)
      RETURNING *
    `, [userGroup.userId, userGroup.groupId]);
    return result.rows[0];
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    await pool.query(`DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2`, [userId, groupId]);
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
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    let whereClause = '';
    const params = [startDate, endDate];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ` AND group_id = ANY($3)`;
      params.push(groupIds);
    }
    
    const ordersResult = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE planned_date >= $1 AND planned_date <= $2${whereClause}
    `, params);
    
    const deliveriesResult = await pool.query(`
      SELECT COUNT(*) as count FROM deliveries 
      WHERE scheduled_date >= $1 AND scheduled_date <= $2${whereClause}
    `, params);
    
    const pendingOrdersResult = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status = 'pending' AND planned_date >= $1 AND planned_date <= $2${whereClause}
    `, params);
    
    // Calculer les palettes et colis UNIQUEMENT depuis les livraisons
    // Les commandes n'ont plus de quantités spécifiques, seulement les livraisons
    const palettesResult = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM deliveries 
      WHERE unit = 'palettes' AND scheduled_date >= $1 AND scheduled_date <= $2${whereClause}
    `, params);
    
    const colisResult = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM deliveries 
      WHERE unit = 'colis' AND scheduled_date >= $1 AND scheduled_date <= $2${whereClause}
    `, params);
    
    console.log('🔍 Palettes query result:', palettesResult.rows[0]);
    console.log('🔍 Colis query result:', colisResult.rows[0]);
    
    const totalPalettes = parseInt(palettesResult.rows[0].total) || 0;
    const totalPackages = parseInt(colisResult.rows[0].total) || 0;
    
    return {
      ordersCount: parseInt(ordersResult.rows[0].count),
      deliveriesCount: parseInt(deliveriesResult.rows[0].count),
      pendingOrdersCount: parseInt(pendingOrdersResult.rows[0].count),
      averageDeliveryTime: 0,
      totalPalettes,
      totalPackages,
    };
  }
}

export const storage = new DatabaseStorage();
