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
      deliveredDate: row.delivered_date ? new Date(row.delivered_date as string) : undefined,
      validatedAt: row.validated_at ? new Date(row.validated_at as string) : undefined,
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
      order: row.order_id_rel ? {
        id: row.order_id_rel as number,
        supplierId: row.supplier_id as number,
        groupId: row.group_id as number,
        plannedDate: row.order_planned_date as string,
        status: row.order_status as string,
        notes: row.order_notes as string,
        createdBy: row.created_by as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } : null
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
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at,
        o.id as order_id_rel, o.planned_date as order_planned_date, o.status as order_status, o.notes as order_notes
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
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
      order: row.order_id_rel ? {
        id: row.order_id_rel as number,
        supplierId: row.supplier_id as number,
        groupId: row.group_id as number,
        plannedDate: row.order_planned_date as string,
        status: row.order_status as string,
        notes: row.order_notes as string,
        createdBy: row.created_by as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } : null
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
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at,
        o.id as order_id_rel, o.planned_date as order_planned_date, o.status as order_status, o.notes as order_notes
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
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
      order: row.order_id_rel ? {
        id: row.order_id_rel as number,
        supplierId: row.supplier_id as number,
        groupId: row.group_id as number,
        plannedDate: row.order_planned_date as string,
        status: row.order_status as string,
        notes: row.order_notes as string,
        createdBy: row.created_by as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } : null
    } as DeliveryWithRelations;
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const { pool } = await import("./db.production.js");
    const result = await pool.query(`
      INSERT INTO deliveries (order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [delivery.orderId, delivery.supplierId, delivery.groupId, delivery.scheduledDate, delivery.quantity, delivery.unit, delivery.status || 'planned', delivery.notes, delivery.createdBy, new Date(), new Date()]);
    
    // Si la livraison est liée à une commande, mettre à jour le statut de la commande
    if (delivery.orderId) {
      console.log('🔗 Mise à jour du statut de la commande liée lors de création:', delivery.orderId);
      await pool.query(`
        UPDATE orders 
        SET status = 'planned', updated_at = $1
        WHERE id = $2
      `, [new Date(), delivery.orderId]);
    }
    
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
      
      // Si on valide le rapprochement, ajouter la date de validation
      if ((delivery as any).reconciled === true) {
        fields.push(`validated_at = $${paramIndex++}`);
        values.push(new Date());
      }
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
    
    // D'abord récupérer la livraison pour obtenir l'order_id
    const deliveryResult = await pool.query(`SELECT order_id FROM deliveries WHERE id = $1`, [id]);
    const delivery = deliveryResult.rows[0];
    
    const now = new Date();
    
    if (blData) {
      await pool.query(`
        UPDATE deliveries 
        SET status = 'delivered', bl_number = $1, bl_amount = $2, delivered_date = $3, updated_at = $3
        WHERE id = $4
      `, [blData.blNumber, blData.blAmount, now, id]);
    } else {
      await pool.query(`
        UPDATE deliveries 
        SET status = 'delivered', delivered_date = $1, updated_at = $1
        WHERE id = $2
      `, [now, id]);
    }
    
    // Si la livraison est liée à une commande, mettre à jour le statut de la commande
    if (delivery && delivery.order_id) {
      console.log('🔗 Mise à jour du statut de la commande liée:', delivery.order_id);
      await pool.query(`
        UPDATE orders 
        SET status = 'delivered', updated_at = $1
        WHERE id = $2
      `, [now, delivery.order_id]);
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

  // Publicity operations
  async getPublicities(year?: number, groupIds?: number[]): Promise<PublicityWithRelations[]> {
    const { pool } = await import("./db.production.js");
    
    console.log('🔍 [PUBLICITÉS] Recherche publicités avec year:', year, 'groupIds:', groupIds);
    
    // D'abord vérifier ce qu'il y a dans la table publicities
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM publicities`);
    console.log('🔍 [PUBLICITÉS] Nombre total de publicités en base:', countResult.rows[0]?.count);
    
    // Vérifier les utilisateurs
    const usersResult = await pool.query(`SELECT id, username FROM users`);
    console.log('🔍 [PUBLICITÉS] Utilisateurs en base:', usersResult.rows.map(u => `${u.id} (${u.username})`));
    
    // Vérifier les publicités avec leurs created_by ET leur année
    const publicitiesDebug = await pool.query(`SELECT id, pub_number, created_by, year, start_date, end_date FROM publicities`);
    console.log('🔍 [PUBLICITÉS] Publicités avec créateurs et années:', publicitiesDebug.rows);
    
    let sqlQuery = `
      SELECT 
        p.id, p.pub_number, p.designation, p.start_date, p.end_date, p.year, 
        p.created_by, p.created_at, p.updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, 
        u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM publicities p
      INNER JOIN users u ON p.created_by = u.id
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (year) {
      conditions.push(`p.year = $${params.length + 1}`);
      params.push(year);
    }
    
    if (groupIds && groupIds.length > 0) {
      conditions.push(`p.id IN (
        SELECT DISTINCT pp.publicity_id 
        FROM publicity_participations pp 
        WHERE pp.group_id = ANY($${params.length + 1})
      )`);
      params.push(groupIds);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sqlQuery += ` ORDER BY p.created_at DESC`;
    
    console.log('🔍 [PUBLICITÉS] Requête SQL:', sqlQuery);
    console.log('🔍 [PUBLICITÉS] Paramètres:', params);
    
    const result = await pool.query(sqlQuery, params);
    console.log('🔍 [PUBLICITÉS] Résultats bruts:', result.rows.length, 'publicités trouvées');
    
    // DIAGNOSTIC SPÉCIAL : tester sans filtre année pour voir toutes les publicités
    if (result.rows.length === 0 && year) {
      console.log('🔧 [DIAGNOSTIC] Test sans filtre année pour voir toutes les publicités...');
      const testQuery = `
        SELECT 
          p.id, p.pub_number, p.designation, p.start_date, p.end_date, p.year, 
          p.created_by, p.created_at, p.updated_at,
          u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
          u.password as creator_password, u.password_changed as creator_password_changed, 
          u.created_at as creator_created_at, u.updated_at as creator_updated_at
        FROM publicities p
        INNER JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `;
      const testResult = await pool.query(testQuery);
      console.log('🔧 [DIAGNOSTIC] Sans filtre année, trouvé:', testResult.rows.length, 'publicités');
      console.log('🔧 [DIAGNOSTIC] Années trouvées:', testResult.rows.map(r => `ID ${r.id}: année ${r.year} (type: ${typeof r.year})`));
    }
    
    const publicities = await Promise.all(result.rows.map(async (row) => {
      // Get participations for this publicity
      const participationsResult = await pool.query(`
        SELECT 
          pp.publicity_id, pp.group_id, pp.created_at,
          g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at
        FROM publicity_participations pp
        INNER JOIN groups g ON pp.group_id = g.id
        WHERE pp.publicity_id = $1
      `, [row.id]);
      
      return {
        id: row.id as number,
        pubNumber: row.pub_number as string,
        designation: row.designation as string,
        startDate: row.start_date as string,
        endDate: row.end_date as string,
        year: row.year as number,
        createdBy: row.created_by as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
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
        participations: participationsResult.rows.map(pRow => ({
          publicityId: pRow.publicity_id as number,
          groupId: pRow.group_id as number,
          createdAt: new Date(pRow.created_at as string),
          group: {
            id: pRow.group_id as number,
            name: pRow.group_name as string,
            color: pRow.group_color as string,
            createdAt: new Date(pRow.group_created_at as string),
            updatedAt: new Date(pRow.group_updated_at as string),
          }
        }))
      };
    }));
    
    return publicities as PublicityWithRelations[];
  }

  async getPublicity(id: number): Promise<PublicityWithRelations | undefined> {
    const { pool } = await import("./db.production.js");
    
    const result = await pool.query(`
      SELECT 
        p.id, p.pub_number, p.designation, p.start_date, p.end_date, p.year, 
        p.created_by, p.created_at, p.updated_at,
        u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, 
        u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM publicities p
      INNER JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    
    // Get participations
    const participationsResult = await pool.query(`
      SELECT 
        pp.publicity_id, pp.group_id, pp.created_at,
        g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at
      FROM publicity_participations pp
      INNER JOIN groups g ON pp.group_id = g.id
      WHERE pp.publicity_id = $1
    `, [id]);
    
    return {
      id: row.id as number,
      pubNumber: row.pub_number as string,
      designation: row.designation as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      year: row.year as number,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
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
      participations: participationsResult.rows.map(pRow => ({
        publicityId: pRow.publicity_id as number,
        groupId: pRow.group_id as number,
        createdAt: new Date(pRow.created_at as string),
        group: {
          id: pRow.group_id as number,
          name: pRow.group_name as string,
          color: pRow.group_color as string,
          createdAt: new Date(pRow.group_created_at as string),
          updatedAt: new Date(pRow.group_updated_at as string),
        }
      }))
    } as PublicityWithRelations;
  }

  async createPublicity(publicity: InsertPublicity): Promise<Publicity> {
    const { pool } = await import("./db.production.js");
    
    const result = await pool.query(`
      INSERT INTO publicities (pub_number, designation, start_date, end_date, year, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      publicity.pubNumber,
      publicity.designation,
      publicity.startDate,
      publicity.endDate,
      publicity.year,
      publicity.createdBy
    ]);
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      pubNumber: row.pub_number as string,
      designation: row.designation as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      year: row.year as number,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    } as Publicity;
  }

  async updatePublicity(id: number, publicity: Partial<InsertPublicity>): Promise<Publicity> {
    const { pool } = await import("./db.production.js");
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (publicity.pubNumber !== undefined) {
      updates.push(`pub_number = $${paramIndex++}`);
      params.push(publicity.pubNumber);
    }
    if (publicity.designation !== undefined) {
      updates.push(`designation = $${paramIndex++}`);
      params.push(publicity.designation);
    }
    if (publicity.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(publicity.startDate);
    }
    if (publicity.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(publicity.endDate);
    }
    if (publicity.year !== undefined) {
      updates.push(`year = $${paramIndex++}`);
      params.push(publicity.year);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const result = await pool.query(`
      UPDATE publicities 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      pubNumber: row.pub_number as string,
      designation: row.designation as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      year: row.year as number,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    } as Publicity;
  }

  async deletePublicity(id: number): Promise<void> {
    const { pool } = await import("./db.production.js");
    
    // Delete participations first (cascade should handle this, but explicit is better)
    await pool.query(`DELETE FROM publicity_participations WHERE publicity_id = $1`, [id]);
    
    // Delete publicity
    await pool.query(`DELETE FROM publicities WHERE id = $1`, [id]);
  }

  async getPublicityParticipations(publicityId: number): Promise<PublicityParticipation[]> {
    const { pool } = await import("./db.production.js");
    
    const result = await pool.query(`
      SELECT publicity_id, group_id, created_at
      FROM publicity_participations
      WHERE publicity_id = $1
    `, [publicityId]);
    
    return result.rows.map(row => ({
      publicityId: row.publicity_id as number,
      groupId: row.group_id as number,
      createdAt: new Date(row.created_at as string),
    })) as PublicityParticipation[];
  }

  async setPublicityParticipations(publicityId: number, groupIds: number[]): Promise<void> {
    const { pool } = await import("./db.production.js");
    
    // Delete existing participations
    await pool.query(`DELETE FROM publicity_participations WHERE publicity_id = $1`, [publicityId]);
    
    // Insert new participations
    if (groupIds.length > 0) {
      const values = groupIds.map((groupId, index) => `($1, $${index + 2})`).join(', ');
      const params = [publicityId, ...groupIds];
      
      await pool.query(`
        INSERT INTO publicity_participations (publicity_id, group_id)
        VALUES ${values}
      `, params);
    }
  }
}

export const storage = new DatabaseStorage();
