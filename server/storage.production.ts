import { pool } from "./db.production";
import { hashPassword } from './auth-utils.production';
import { nanoid } from 'nanoid';
import type { IStorage } from "./storage";
import type { 
  User, 
  UpsertUser, 
  Group, 
  InsertGroup, 
  Supplier, 
  InsertSupplier, 
  Order, 
  InsertOrder, 
  Delivery, 
  InsertDelivery, 
  UserGroup, 
  InsertUserGroup,
  Publicity,
  InsertPublicity,
  PublicityParticipation,
  Role,
  InsertRole,
  Permission,
  InsertPermission,
  RolePermission,
  NocodbConfig,
  InsertNocodbConfig,
  CustomerOrder,
  InsertCustomerOrder
} from "@shared/schema";

// Production storage implementation using raw PostgreSQL queries
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUserByEmail(userData.email);
    if (existing) {
      return this.updateUser(existing.id, userData);
    }
    return this.createUser(userData);
  }

  async getUserWithGroups(id: string): Promise<any> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // Récupérer les groupes de l'utilisateur
    const groupsResult = await pool.query(`
      SELECT g.*, ug.user_id, ug.group_id 
      FROM groups g 
      JOIN user_groups ug ON g.id = ug.group_id 
      WHERE ug.user_id = $1
    `, [id]);

    // Récupérer les rôles de l'utilisateur
    const rolesResult = await pool.query(`
      SELECT r.*, ur.assigned_by, ur.assigned_at
      FROM roles r 
      JOIN user_roles ur ON r.id = ur.role_id 
      WHERE ur.user_id = $1
    `, [id]);

    return {
      ...user,
      userGroups: groupsResult.rows.map(row => ({
        userId: row.user_id,
        groupId: row.group_id,
        group: {
          id: row.id,
          name: row.name,
          color: row.color,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      })),
      userRoles: rolesResult.rows.map(row => ({
        userId: user.id,
        roleId: row.id,
        assignedBy: row.assigned_by,
        assignedAt: row.assigned_at,
        role: {
          id: row.id,
          name: row.name,
          displayName: row.display_name,
          description: row.description,
          color: row.color,
          isSystem: row.is_system,
          isActive: row.is_active
        }
      }))
    };
  }

  async getUsers(): Promise<User[]> {
    // Version complète récupérant les utilisateurs avec leurs rôles ET groupes
    try {
      // Récupérer tous les utilisateurs
      const usersResult = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.name,
          u.password,
          u.role,
          u.password_changed,
          u.created_at,
          u.updated_at
        FROM users u
        ORDER BY u.created_at DESC
      `);
      
      console.log(`✅ getUsers found ${usersResult.rows.length} users`);
      
      // Pour chaque utilisateur, récupérer ses rôles et groupes
      const usersWithData = await Promise.all(usersResult.rows.map(async (user) => {
        // Récupérer les rôles
        const rolesResult = await pool.query(`
          SELECT r.*, ur.assigned_by, ur.assigned_at
          FROM roles r 
          JOIN user_roles ur ON r.id = ur.role_id 
          WHERE ur.user_id = $1
        `, [user.id]);
        
        // Récupérer les groupes
        const groupsResult = await pool.query(`
          SELECT g.*, ug.user_id, ug.group_id 
          FROM groups g 
          JOIN user_groups ug ON g.id = ug.group_id 
          WHERE ug.user_id = $1
        `, [user.id]);
        
        return {
          ...user,
          userRoles: rolesResult.rows.map(role => ({
            userId: user.id,
            roleId: role.id,
            assignedBy: role.assigned_by,
            assignedAt: role.assigned_at,
            role: {
              id: role.id,
              name: role.name,
              displayName: role.display_name,
              description: role.description,
              color: role.color,
              isSystem: role.is_system,
              isActive: role.is_active
            }
          })),
          userGroups: groupsResult.rows.map(group => ({
            userId: group.user_id,
            groupId: group.group_id,
            group: {
              id: group.id,
              name: group.name,
              color: group.color,
              createdAt: group.created_at,
              updatedAt: group.updated_at
            }
          }))
        };
      }));
      
      console.log(`✅ getUsers returned ${usersWithData.length} users with roles and groups`);
      return usersWithData;
      
    } catch (error) {
      console.error('❌ Error in getUsers with roles and groups, falling back to simple query:', error);
      
      // Fallback: requête simple sans rôles ni groupes si erreur
      const simpleResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return simpleResult.rows.map(row => ({
        ...row,
        userRoles: [],
        userGroups: []
      }));
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    // Hash password if provided
    const hashedPassword = userData.password ? await hashPassword(userData.password) : null;
    
    const result = await pool.query(`
      INSERT INTO users (id, username, email, name, first_name, last_name, profile_image_url, password, role, password_changed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      userData.id || nanoid(),
      userData.username,
      userData.email,
      userData.name,
      userData.firstName,
      userData.lastName,
      userData.profileImageUrl,
      hashedPassword,
      userData.role || 'employee',
      userData.passwordChanged || false
    ]);
    return result.rows[0];
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    console.log('🔄 updateUser called:', { id, userData });
    
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        throw new Error(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      console.log('✅ User found:', existingUser.username);
      
      // Validation des champs obligatoires seulement si fournis
      if (userData.firstName !== undefined && (!userData.firstName || !userData.firstName.trim())) {
        throw new Error('Le prénom ne peut pas être vide');
      }
      if (userData.lastName !== undefined && (!userData.lastName || !userData.lastName.trim())) {
        throw new Error('Le nom ne peut pas être vide');
      }
      if (userData.email !== undefined && (!userData.email || !userData.email.trim())) {
        throw new Error('L\'email ne peut pas être vide');
      }
      if (userData.email && !userData.email.includes('@')) {
        throw new Error('L\'email doit être valide');
      }
    
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(userData)) {
      // Ignorer les chaînes vides pour les champs texte, mais accepter false/true pour les booléens
      const shouldSkip = value === undefined || value === null || 
                        (typeof value === 'string' && value.trim() === '') ||
                        (key === 'password' && (!value || value.trim() === ''));
      
      if (!shouldSkip) {
        if (key === 'password') {
          // Hash password before storing et marquer comme changé
          const hashedPassword = await hashPassword(value as string);
          fields.push(`password = $${paramIndex}`);
          values.push(hashedPassword);
          paramIndex++;
          
          // Marquer le mot de passe comme changé
          fields.push(`password_changed = $${paramIndex}`);
          values.push(true);
        } else {
          const dbKey = key === 'firstName' ? 'first_name' : 
                       key === 'lastName' ? 'last_name' : 
                       key === 'profileImageUrl' ? 'profile_image_url' :
                       key === 'passwordChanged' ? 'password_changed' : key;
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

      if (fields.length === 0) {
        console.log('⚠️ No fields to update, returning existing user');
        return existingUser;
      }

      values.push(id);
      console.log('📝 SQL Query:', `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`);
      console.log('📝 SQL Values:', values);
      
      const result = await pool.query(`
        UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (!result.rows[0]) {
        throw new Error('Aucun utilisateur mis à jour - vérifiez l\'ID');
      }
      
      console.log('✅ updateUser success:', { id, fieldsUpdated: fields.length, updatedUser: result.rows[0] });
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ updateUser error:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async getGroups(): Promise<Group[]> {
    const result = await pool.query('SELECT * FROM groups ORDER BY name');
    return result.rows;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    console.log('🏪 Creating group with data:', { 
      name: group.name, 
      color: group.color,
      fullData: group 
    });
    
    try {
      const result = await pool.query(`
        INSERT INTO groups (name, color) 
        VALUES ($1, $2) 
        RETURNING *
      `, [group.name, group.color]);
      
      console.log('✅ Group created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      console.error('📊 Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      });
      throw error;
    }
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group> {
    const result = await pool.query(`
      UPDATE groups SET name = $1, color = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [group.name, group.color, id]);
    return result.rows[0];
  }

  async deleteGroup(id: number): Promise<void> {
    await pool.query('DELETE FROM groups WHERE id = $1', [id]);
  }

  async getSuppliers(): Promise<Supplier[]> {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return result.rows;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    console.log('🚚 Creating supplier with data:', { 
      name: supplier.name, 
      contact: supplier.contact,
      phone: supplier.phone,
      fullData: supplier 
    });
    
    try {
      const result = await pool.query(`
        INSERT INTO suppliers (name, contact, phone) 
        VALUES ($1, $2, $3) 
        RETURNING *
      `, [supplier.name, supplier.contact || '', supplier.phone || '']);
      
      console.log('✅ Supplier created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to create supplier:', error);
      console.error('📊 Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      });
      throw error;
    }
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const result = await pool.query(`
      UPDATE suppliers SET name = $1, contact = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [supplier.name, supplier.contact, supplier.phone, id]);
    return result.rows[0];
  }

  async deleteSupplier(id: number): Promise<void> {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
  }

  // Simplified methods for production - implement core functionality only
  async getOrders(groupIds?: number[]): Promise<any[]> {
    console.log('📦 getOrders production called with groupIds:', groupIds);
    
    let whereClause = '';
    let params = [];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ' WHERE o.group_id = ANY($1)';
      params = [groupIds];
    }
    
    console.log('📦 SQL Query:', {
      whereClause,
      params,
      query: `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC`
    });
    
    const result = await pool.query(`
      SELECT o.*, 
             s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
             g.id as group_id, g.name as group_name, g.color as group_color,
             u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN groups g ON o.group_id = g.id
      LEFT JOIN users u ON o.created_by = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `, params);
    
    console.log('📦 Query result:', {
      rowCount: result.rows.length,
      sampleRows: result.rows.slice(0, 2).map(row => ({
        id: row.id,
        groupId: row.group_id,
        plannedDate: row.planned_date,
        supplierName: row.supplier_name,
        groupName: row.group_name
      }))
    });
    
    // Transformer pour correspondre exactement à la structure Drizzle
    return (result.rows || []).map(row => ({
      id: row.id,
      supplierId: row.supplier_id,
      groupId: row.group_id,
      plannedDate: row.planned_date,
      quantity: row.quantity,
      unit: row.unit,
      status: row.status,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact || '',
        phone: row.supplier_phone || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      group: row.group_name ? {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color || '#666666',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        email: row.creator_email || '',
        name: row.creator_name || row.creator_username,
        firstName: row.creator_name || row.creator_username,
        lastName: '',
        role: 'admin'
      } : null
    }));
  }

  async getOrdersByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<any[]> {
    let whereClause = 'WHERE o.planned_date BETWEEN $1 AND $2';
    let params = [startDate, endDate];
    
    if (groupIds && groupIds.length > 0) {
      whereClause += ' AND o.group_id = ANY($3)';
      params.push(groupIds);
    }
    
    const result = await pool.query(`
      SELECT o.*, 
             s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
             g.id as group_id, g.name as group_name, g.color as group_color,
             u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN groups g ON o.group_id = g.id
      LEFT JOIN users u ON o.created_by = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `, params);
    
    console.log('📅 getOrdersByDateRange debug:', { startDate, endDate, groupIds, orderCount: result.rows.length });
    
    // Transformer pour correspondre exactement à la structure Drizzle
    return (result.rows || []).map(row => ({
      id: row.id,
      supplierId: row.supplier_id,
      groupId: row.group_id,
      plannedDate: row.planned_date,
      quantity: row.quantity,
      unit: row.unit,
      status: row.status,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact || '',
        phone: row.supplier_phone || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      group: row.group_name ? {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color || '#666666',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        email: row.creator_email || '',
        name: row.creator_name || row.creator_username,
        firstName: row.creator_name || row.creator_username,
        lastName: '',
        role: 'admin'
      } : null,
      deliveries: [] // Pas de deliveries dans cette méthode
    }));
  }

  async getOrder(id: number): Promise<any> {
    const result = await pool.query(`
      SELECT o.*, s.name as supplier_name, g.name as group_name, g.color as group_color,
             u.username as creator_username
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN groups g ON o.group_id = g.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [id]);
    return result.rows[0] || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    console.log('📦 createOrder production called with:', order);
    
    const result = await pool.query(`
      INSERT INTO orders (supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      order.supplierId,
      order.groupId,
      order.plannedDate,
      order.quantity,
      order.unit,
      order.status || 'pending',
      order.notes,
      order.createdBy
    ]);
    
    console.log('✅ Order created in production DB:', {
      id: result.rows[0].id,
      groupId: result.rows[0].group_id,
      plannedDate: result.rows[0].planned_date,
      supplierId: result.rows[0].supplier_id,
      status: result.rows[0].status
    });
    
    return result.rows[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const result = await pool.query(`
      UPDATE orders SET 
        supplier_id = $1, group_id = $2, planned_date = $3, quantity = $4, 
        unit = $5, status = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      order.supplierId,
      order.groupId,
      order.plannedDate,
      order.quantity,
      order.unit,
      order.status,
      order.notes,
      id
    ]);
    return result.rows[0];
  }

  async deleteOrder(id: number): Promise<void> {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
  }

  async getDeliveries(groupIds?: number[]): Promise<any[]> {
    let whereClause = '';
    let params = [];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ' WHERE d.group_id = ANY($1)';
      params = [groupIds];
    }
    
    const result = await pool.query(`
      SELECT d.*, 
             s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
             g.id as group_id, g.name as group_name, g.color as group_color,
             u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name,
             o.id as order_id_rel, o.planned_date as order_planned_date, o.status as order_status
      FROM deliveries d
      LEFT JOIN suppliers s ON d.supplier_id = s.id
      LEFT JOIN groups g ON d.group_id = g.id  
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `, params);
    
    // Transformer pour correspondre exactement à la structure Drizzle
    return (result.rows || []).map(row => ({
      id: row.id,
      orderId: row.order_id,
      supplierId: row.supplier_id,
      groupId: row.group_id,
      scheduledDate: row.scheduled_date,
      quantity: row.quantity,
      unit: row.unit,
      status: row.status,
      notes: row.notes,
      blNumber: row.bl_number,
      blAmount: row.bl_amount,
      invoiceReference: row.invoice_reference,
      invoiceAmount: row.invoice_amount,
      reconciled: row.reconciled,
      deliveredDate: row.delivered_date,
      validatedAt: row.validated_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact || '',
        phone: row.supplier_phone || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      group: row.group_name ? {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color || '#666666',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        email: row.creator_email || '',
        name: row.creator_name || row.creator_username
      } : null,
      order: row.order_id_rel ? {
        id: row.order_id_rel,
        plannedDate: row.order_planned_date,
        status: row.order_status
      } : null
    }));
  }

  async getDeliveriesByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<any[]> {
    let whereClause = 'WHERE d.scheduled_date BETWEEN $1 AND $2';
    let params = [startDate, endDate];
    
    if (groupIds && groupIds.length > 0) {
      whereClause += ' AND d.group_id = ANY($3)';
      params.push(groupIds);
    }
    
    const result = await pool.query(`
      SELECT d.*, 
             s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
             g.id as group_id, g.name as group_name, g.color as group_color,
             u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name,
             o.id as order_id_rel, o.planned_date as order_planned_date, o.status as order_status
      FROM deliveries d
      LEFT JOIN suppliers s ON d.supplier_id = s.id
      LEFT JOIN groups g ON d.group_id = g.id
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `, params);
    
    console.log('🚛 getDeliveriesByDateRange debug:', { startDate, endDate, groupIds, deliveryCount: result.rows.length });
    
    // Transformer pour correspondre exactement à la structure Drizzle
    return (result.rows || []).map(row => ({
      id: row.id,
      orderId: row.order_id,
      supplierId: row.supplier_id,
      groupId: row.group_id,
      scheduledDate: row.scheduled_date,
      quantity: row.quantity,
      unit: row.unit,
      status: row.status,
      notes: row.notes,
      blNumber: row.bl_number,
      blAmount: row.bl_amount,
      invoiceReference: row.invoice_reference,
      invoiceAmount: row.invoice_amount,
      reconciled: row.reconciled,
      deliveredDate: row.delivered_date,
      validatedAt: row.validated_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact || '',
        phone: row.supplier_phone || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      group: row.group_name ? {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color || '#666666',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } : null,
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        email: row.creator_email || '',
        name: row.creator_name || row.creator_username,
        firstName: row.creator_name || row.creator_username,
        lastName: '',
        role: 'admin'
      } : null,
      order: row.order_id_rel ? {
        id: row.order_id_rel,
        plannedDate: row.order_planned_date,
        status: row.order_status
      } : null
    }));
  }

  async getDelivery(id: number): Promise<any> {
    const result = await pool.query(`
      SELECT d.*, s.name as supplier_name, g.name as group_name, g.color as group_color,
             u.username as creator_username, o.planned_date as order_planned_date
      FROM deliveries d
      JOIN suppliers s ON d.supplier_id = s.id
      JOIN groups g ON d.group_id = g.id
      JOIN users u ON d.created_by = u.id
      LEFT JOIN orders o ON d.order_id = o.id
      WHERE d.id = $1
    `, [id]);
    return result.rows[0] || undefined;
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const result = await pool.query(`
      INSERT INTO deliveries (order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      delivery.orderId,
      delivery.supplierId,
      delivery.groupId,
      delivery.scheduledDate,
      delivery.quantity,
      delivery.unit,
      delivery.status || 'pending',
      delivery.notes,
      delivery.createdBy
    ]);
    return result.rows[0];
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construire dynamiquement la requête pour éviter les erreurs de colonnes manquantes
    for (const [key, value] of Object.entries(delivery)) {
      if (value !== undefined) {
        const dbKey = key === 'orderId' ? 'order_id' :
                     key === 'supplierId' ? 'supplier_id' :
                     key === 'groupId' ? 'group_id' :
                     key === 'scheduledDate' ? 'scheduled_date' :
                     key === 'blNumber' ? 'bl_number' :
                     key === 'blAmount' ? 'bl_amount' :
                     key === 'invoiceReference' ? 'invoice_reference' :
                     key === 'invoiceAmount' ? 'invoice_amount' :
                     key === 'deliveredDate' ? 'delivered_date' :
                     key === 'validatedAt' ? 'validated_at' :
                     key === 'createdBy' ? 'created_by' : key;
        
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE deliveries SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    console.log('🔄 updateDelivery production:', { id, fieldsUpdated: fields.length, delivery });
    return result.rows[0];
  }

  async deleteDelivery(id: number): Promise<void> {
    // Récupérer la livraison avant suppression pour connaître la commande liée
    const deliveryResult = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    const delivery = deliveryResult.rows[0];
    
    // Supprimer la livraison
    await pool.query('DELETE FROM deliveries WHERE id = $1', [id]);
    
    // Si la livraison était liée à une commande, gérer le statut de la commande
    if (delivery?.order_id) {
      // Vérifier s'il reste d'autres livraisons liées à cette commande
      const remainingResult = await pool.query(
        'SELECT COUNT(*) as count FROM deliveries WHERE order_id = $1', 
        [delivery.order_id]
      );
      
      const remainingCount = parseInt(remainingResult.rows[0].count);
      
      if (remainingCount === 0) {
        // Plus aucune livraison liée : remettre la commande en "pending"
        await pool.query(`
          UPDATE orders SET status = 'pending', updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `, [delivery.order_id]);
        
        console.log('✅ Order status reset to pending after delivery deletion:', delivery.order_id);
      }
    }
  }

  async validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void> {
    try {
      // Vérifier d'abord quelles colonnes existent dans la table deliveries
      const columnsCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'deliveries' AND table_schema = 'public'
      `);
      
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      console.log('🔍 validateDelivery - Available columns:', existingColumns);
      
      // Construire la requête en fonction des colonnes disponibles
      const updates = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [id, 'delivered'];
      let paramIndex = 3;
      
      if (existingColumns.includes('delivered_date')) {
        updates.push(`delivered_date = $${paramIndex}`);
        params.push(new Date().toISOString());
        paramIndex++;
      }
      
      if (existingColumns.includes('validated_at')) {
        updates.push(`validated_at = $${paramIndex}`);
        params.push(new Date().toISOString());
        paramIndex++;
      }
      
      if (blData?.blNumber && existingColumns.includes('bl_number')) {
        updates.push(`bl_number = $${paramIndex}`);
        params.push(blData.blNumber);
        paramIndex++;
      }
      
      if (blData?.blAmount !== undefined && existingColumns.includes('bl_amount')) {
        updates.push(`bl_amount = $${paramIndex}`);
        params.push(blData.blAmount);
        paramIndex++;
      }
      
      const result = await pool.query(`
        UPDATE deliveries SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `, params);
      
      console.log('✅ validateDelivery success:', { id, blData, updatedColumns: updates.length });
      
      // Mettre à jour le statut de la commande liée si elle existe
      if (result.rows[0]?.order_id) {
        await pool.query(`
          UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [result.rows[0].order_id]);
        console.log('✅ Order status updated to delivered:', result.rows[0].order_id);
      }
      
    } catch (error) {
      console.error('❌ validateDelivery error:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    const result = await pool.query('SELECT * FROM user_groups WHERE user_id = $1', [userId]);
    return result.rows;
  }

  async assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup> {
    console.log('🔄 assignUserToGroup appelé avec:', userGroup);
    
    try {
      // Vérifier que l'utilisateur existe
      const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [userGroup.userId]);
      if (userCheck.rows.length === 0) {
        throw new Error(`Utilisateur non trouvé: ${userGroup.userId}`);
      }
      console.log('✅ Utilisateur vérifié:', userCheck.rows[0]);
      
      // Vérifier que le groupe existe
      const groupCheck = await pool.query('SELECT id, name FROM groups WHERE id = $1', [userGroup.groupId]);
      if (groupCheck.rows.length === 0) {
        throw new Error(`Groupe non trouvé: ${userGroup.groupId}`);
      }
      console.log('✅ Groupe vérifié:', groupCheck.rows[0]);
      
      // Vérifier si l'assignation existe déjà
      const existingCheck = await pool.query(
        'SELECT * FROM user_groups WHERE user_id = $1 AND group_id = $2', 
        [userGroup.userId, userGroup.groupId]
      );
      
      if (existingCheck.rows.length > 0) {
        console.log('ℹ️ Assignation déjà existante, retour de l\'existante');
        return existingCheck.rows[0];
      }
      
      // Effectuer l'insertion
      const result = await pool.query(`
        INSERT INTO user_groups (user_id, group_id) 
        VALUES ($1, $2) 
        RETURNING *
      `, [userGroup.userId, userGroup.groupId]);
      
      console.log('✅ Assignation créée avec succès:', result.rows[0]);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Erreur dans assignUserToGroup:', error);
      throw error;
    }
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<void> {
    await pool.query('DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2', [userId, groupId]);
  }

  async getMonthlyStats(year: number, month: number, groupIds?: number[]): Promise<any> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    let whereClause = '';
    let params = [startDate, endDate];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ' AND group_id = ANY($3)';
      params.push(groupIds);
    }

    const [ordersResult, deliveriesResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM orders WHERE planned_date BETWEEN $1 AND $2${whereClause}`, params),
      pool.query(`SELECT COUNT(*) FROM deliveries WHERE scheduled_date BETWEEN $1 AND $2${whereClause}`, params)
    ]);

    return {
      ordersCount: parseInt(ordersResult.rows[0].count),
      deliveriesCount: parseInt(deliveriesResult.rows[0].count),
      pendingOrdersCount: 0,
      averageDeliveryTime: 0,
      totalPalettes: 5,
      totalPackages: 3
    };
  }

  // Publicities methods
  async getPublicities(year?: number, groupIds?: number[]): Promise<any[]> {
    // Filtre par année si spécifiée
    let whereClause = '';
    let params = [];
    
    if (year) {
      whereClause = 'WHERE year = $1';
      params.push(year);
    }
    
    const publicities = await pool.query(`SELECT * FROM publicities ${whereClause} ORDER BY start_date DESC`, params);
    console.log('🎯 getPublicities debug:', { year, whereClause, publicityCount: publicities.rows.length });
    
    // Pour chaque publicité, récupérer ses participations
    const publicityData = await Promise.all(
      publicities.rows.map(async (pub) => {
        const participations = await pool.query(
          'SELECT pp.group_id, g.name as group_name, g.color as group_color FROM publicity_participations pp LEFT JOIN groups g ON pp.group_id = g.id WHERE pp.publicity_id = $1', 
          [pub.id]
        );
        
        return {
          id: pub.id,
          pubNumber: pub.pub_number,
          designation: pub.designation || pub.title, // Support ancien champ title
          startDate: pub.start_date,
          endDate: pub.end_date,
          year: pub.year,
          createdBy: pub.created_by,
          createdAt: pub.created_at,
          updatedAt: pub.updated_at,
          participations: (participations.rows || []).map(p => ({
            groupId: p.group_id,
            group: {
              id: p.group_id,
              name: p.group_name,
              color: p.group_color || '#666666'
            }
          }))
        };
      })
    );
    
    console.log('🎯 getPublicities result:', publicityData.length, 'publicités pour année', year);
    return publicityData;
  }

  async getPublicity(id: number): Promise<any> {
    const result = await pool.query('SELECT * FROM publicities WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async createPublicity(publicity: InsertPublicity): Promise<Publicity> {
    const result = await pool.query(`
      INSERT INTO publicities (pub_number, designation, start_date, end_date, year, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      publicity.pubNumber,
      publicity.designation,
      publicity.startDate,
      publicity.endDate,
      publicity.year,
      publicity.createdBy
    ]);
    return result.rows[0];
  }

  async updatePublicity(id: number, publicity: Partial<InsertPublicity>): Promise<Publicity> {
    const result = await pool.query(`
      UPDATE publicities SET 
        pub_number = $1, designation = $2, start_date = $3, 
        end_date = $4, year = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      publicity.pubNumber,
      publicity.designation,
      publicity.startDate,
      publicity.endDate,
      publicity.year,
      id
    ]);
    return result.rows[0];
  }

  async deletePublicity(id: number): Promise<void> {
    await pool.query('DELETE FROM publicities WHERE id = $1', [id]);
  }

  async getPublicityParticipations(publicityId: number): Promise<PublicityParticipation[]> {
    const result = await pool.query('SELECT * FROM publicity_participations WHERE publicity_id = $1', [publicityId]);
    return result.rows;
  }

  async setPublicityParticipations(publicityId: number, groupIds: number[]): Promise<void> {
    await pool.query('DELETE FROM publicity_participations WHERE publicity_id = $1', [publicityId]);
    
    for (const groupId of groupIds) {
      await pool.query(`
        INSERT INTO publicity_participations (publicity_id, group_id) 
        VALUES ($1, $2)
      `, [publicityId, groupId]);
    }
  }

  // ===== ROLE MANAGEMENT METHODS =====

  async getRoles(): Promise<Role[]> {
    try {
      const result = await pool.query(`
        SELECT r.id, 
               r.name, 
               r.display_name,
               r.description, 
               r.color,
               r.is_system,
               r.is_active,
               r.created_at,
               r.updated_at,
               COALESCE(
                 JSON_AGG(
                   CASE WHEN p.id IS NOT NULL THEN
                     JSON_BUILD_OBJECT(
                       'id', p.id,
                       'name', p.name,
                       'displayName', p.display_name,
                       'description', p.description,
                       'category', p.category,
                       'action', p.action,
                       'resource', p.resource,
                       'isSystem', p.is_system,
                       'createdAt', p.created_at
                     )
                   END
                 ) FILTER (WHERE p.id IS NOT NULL),
                 '[]'::json
               ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id, r.name, r.display_name, r.description, r.color, r.is_system, r.is_active, r.created_at, r.updated_at
        ORDER BY r.name
      `);
      
      // 🔍 DIAGNOSTIC: Log détaillé pour identifier le problème
      console.log('🔍 DIAGNOSTIC RÔLES PRODUCTION:');
      result.rows.forEach((row, index) => {
        console.log(`Role ${index + 1}:`, {
          id: row.id,
          name: row.name,
          displayName: row.display_name,
          color: row.color,
          isGrayColor: row.color === '#6b7280',
          expectedColors: {
            admin: '#dc2626',
            manager: '#2563eb',
            employee: '#16a34a',
            directeur: '#7c3aed'
          }
        });
      });
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description || '',
        color: row.color || '#6b7280',
        isSystem: row.is_system || false,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        rolePermissions: Array.isArray(row.permissions) ? row.permissions.map(p => ({
          id: p.id,
          permissionId: p.id,
          roleId: row.id,
          createdAt: p.createdAt,
          permission: {
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            description: p.description,
            category: p.category,
            action: p.action,
            resource: p.resource,
            isSystem: p.isSystem,
            createdAt: p.createdAt
          }
        })) : []
      })) || [];
    } catch (error) {
      console.error("Error in getRoles:", error);
      return [];
    }
  }

  async getRoleWithPermissions(id: number): Promise<Role | undefined> {
    try {
      const result = await pool.query(`
        SELECT r.id, 
               r.name, 
               r.display_name,
               r.description, 
               r.color,
               r.is_system,
               r.is_active,
               r.created_at,
               r.updated_at,
               COALESCE(
                 JSON_AGG(
                   CASE WHEN p.id IS NOT NULL THEN
                     JSON_BUILD_OBJECT(
                       'id', p.id,
                       'name', p.name,
                       'displayName', p.display_name,
                       'description', p.description,
                       'category', p.category,
                       'action', p.action,
                       'resource', p.resource,
                       'isSystem', p.is_system,
                       'createdAt', p.created_at
                     )
                   END
                 ) FILTER (WHERE p.id IS NOT NULL),
                 '[]'::json
               ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = $1
        GROUP BY r.id, r.name, r.display_name, r.description, r.color, r.is_system, r.is_active, r.created_at, r.updated_at
      `, [id]);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description || '',
        color: row.color || '#6b7280',
        isSystem: row.is_system || false,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        permissions: Array.isArray(row.permissions) ? row.permissions : []
      };
    } catch (error) {
      console.error("Error in getRoleWithPermissions:", error);
      return undefined;
    }
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    try {
      const result = await pool.query(`
        INSERT INTO roles (name, display_name, description, color, is_system, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        roleData.name,
        roleData.displayName || roleData.name,
        roleData.description || '',
        roleData.color || '#6b7280',
        roleData.isSystem || false,
        roleData.isActive !== false
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description,
        color: row.color,
        isSystem: row.is_system,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error in createRole:", error);
      throw error;
    }
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    try {
      const setParts = [];
      const values = [];
      let paramCount = 1;

      if (roleData.name !== undefined) {
        setParts.push(`name = $${paramCount}`);
        values.push(roleData.name);
        paramCount++;
      }
      if (roleData.displayName !== undefined) {
        setParts.push(`display_name = $${paramCount}`);
        values.push(roleData.displayName);
        paramCount++;
      }
      if (roleData.description !== undefined) {
        setParts.push(`description = $${paramCount}`);
        values.push(roleData.description);
        paramCount++;
      }
      if (roleData.color !== undefined) {
        setParts.push(`color = $${paramCount}`);
        values.push(roleData.color);
        paramCount++;
      }
      if (roleData.isActive !== undefined) {
        setParts.push(`is_active = $${paramCount}`);
        values.push(roleData.isActive);
        paramCount++;
      }

      setParts.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await pool.query(`
        UPDATE roles 
        SET ${setParts.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description,
        color: row.color,
        isSystem: row.is_system,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error in updateRole:", error);
      throw error;
    }
  }

  async deleteRole(id: number): Promise<void> {
    try {
      // Delete role permissions first
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      // Delete the role
      await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    } catch (error) {
      console.error("Error in deleteRole:", error);
      throw error;
    }
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      const result = await pool.query(`
        SELECT id, name, display_name, description, category, action, resource, is_system, created_at 
        FROM permissions 
        ORDER BY category, name
      `);
      
      // Transformation des données snake_case vers camelCase pour cohérence TypeScript
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description || '',
        category: row.category,
        action: row.action || 'read',
        resource: row.resource,
        isSystem: row.is_system || false,
        createdAt: row.created_at
      })) || [];
    } catch (error) {
      console.error("Error in getPermissions:", error);
      return [];
    }
  }

  async createPermission(permissionData: InsertPermission): Promise<Permission> {
    try {
      const result = await pool.query(`
        INSERT INTO permissions (
          name, display_name, description, category, action, resource, is_system
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        permissionData.name,
        permissionData.displayName || permissionData.name,
        permissionData.description || '',
        permissionData.category,
        permissionData.action || '',
        permissionData.resource || '',
        permissionData.isSystem || false
      ]);
      
      return {
        id: result.rows[0].id,
        name: result.rows[0].name,
        displayName: result.rows[0].display_name || result.rows[0].name,
        description: result.rows[0].description,
        category: result.rows[0].category,
        action: result.rows[0].action || 'read',
        resource: result.rows[0].resource,
        isSystem: result.rows[0].is_system,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      console.error("Error in createPermission:", error);
      throw error;
    }
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    try {
      const result = await pool.query(`
        SELECT rp.*, p.name as permission_name, r.name as role_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE rp.role_id = $1
      `, [roleId]);
      
      return result.rows.map(row => ({
        roleId: row.role_id,
        permissionId: row.permission_id,
        createdAt: row.created_at
      })) || [];
    } catch (error) {
      console.error("Error in getRolePermissions:", error);
      return [];
    }
  }

  async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    try {
      // Delete existing permissions for this role
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      
      // Insert new permissions
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permId, index) => 
          `($1, $${index + 2}, CURRENT_TIMESTAMP)`
        ).join(', ');
        
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES ${values}
        `, [roleId, ...permissionIds]);
      }
    } catch (error) {
      console.error("Error in setRolePermissions:", error);
      throw error;
    }
  }

  async setUserRoles(userId: string, roleIds: number[], assignedBy: string): Promise<void> {
    try {
      console.log(`🔧 setUserRoles called:`, { userId, roleIds, assignedBy });
      
      // Vérifier que l'utilisateur existe
      const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userExists.rows.length === 0) {
        console.error(`❌ User ${userId} not found`);
        throw new Error(`User with ID ${userId} does not exist`);
      }
      console.log(`✅ User ${userId} exists`);

      // Vérifier les rôles disponibles
      const availableRoles = await pool.query('SELECT id, name FROM roles ORDER BY id');
      console.log(`📋 Available roles:`, availableRoles.rows);

      // Delete existing user roles
      const deleteResult = await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      console.log(`🗑️  Deleted ${deleteResult.rowCount} existing roles for user ${userId}`);
      
      // Insert new user role (only one role per user)
      if (roleIds.length > 0) {
        const roleId = roleIds[0]; // Take only the first role
        console.log(`🎯 Attempting to assign role ID: ${roleId}`);
        
        // Vérifier que le rôle existe
        const roleExists = await pool.query('SELECT id, name FROM roles WHERE id = $1', [roleId]);
        if (roleExists.rows.length === 0) {
          console.error(`❌ Role ${roleId} not found in available roles:`, availableRoles.rows.map(r => r.id));
          throw new Error(`Role with ID ${roleId} does not exist. Available roles: ${availableRoles.rows.map(r => `${r.id}(${r.name})`).join(', ')}`);
        }
        
        console.log(`✅ Role ${roleId} (${roleExists.rows[0].name}) exists`);

        const insertResult = await pool.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          RETURNING *
        `, [userId, roleId, assignedBy]);
        
        console.log(`✅ Successfully assigned role:`, insertResult.rows[0]);
      } else {
        console.log(`⚠️  No roles provided for user ${userId}`);
      }
    } catch (error) {
      console.error("❌ Error in setUserRoles:", error);
      throw error;
    }
  }

  // NocoDB Config methods
  async getNocodbConfigs(): Promise<NocodbConfig[]> {
    try {
      const result = await pool.query(`
        SELECT id, name, base_url, project_id, api_token, description, 
               is_active, created_by, created_at, updated_at
        FROM nocodb_config 
        ORDER BY created_at DESC
      `);
      
      // Transformation des données snake_case vers camelCase pour cohérence TypeScript
      const transformedData = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        baseUrl: row.base_url,
        projectId: row.project_id,
        apiToken: row.api_token,
        description: row.description,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log('📊 getNocodbConfigs result:', { 
        rows: transformedData.length, 
        transformed: true,
        sample: transformedData[0] || 'empty'
      });
      
      return Array.isArray(transformedData) ? transformedData : [];
    } catch (error) {
      console.error('❌ Error in getNocodbConfigs:', error);
      return [];
    }
  }

  async getNocodbConfig(id: number): Promise<NocodbConfig | undefined> {
    const result = await pool.query(`
      SELECT id, name, base_url, project_id, api_token, description, 
             is_active, created_by, created_at, updated_at
      FROM nocodb_config 
      WHERE id = $1
    `, [id]);
    
    if (!result.rows[0]) return undefined;
    
    // Transformation des données snake_case vers camelCase
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      baseUrl: row.base_url,
      projectId: row.project_id,
      apiToken: row.api_token,
      description: row.description,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createNocodbConfig(config: InsertNocodbConfig): Promise<NocodbConfig> {
    console.log('📝 Creating NocoDB config with data:', config);
    
    try {
      // Première tentative avec la structure moderne
      const result = await pool.query(`
        INSERT INTO nocodb_config (
          name, base_url, project_id, api_token, description, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        config.name,
        config.baseUrl,
        config.projectId || '',
        config.apiToken,
        config.description || '',
        config.isActive !== undefined ? config.isActive : true,
        config.createdBy
      ]);
      
      console.log('✅ NocoDB config created:', result.rows[0]);
      return result.rows[0];
      
    } catch (error: any) {
      // Si erreur de contrainte NOT NULL sur colonnes obsolètes
      if (error.code === '23502' && (error.column === 'table_id' || error.column === 'table_name' || error.column === 'invoice_column_name')) {
        console.log('🔧 Detected obsolete columns with NOT NULL constraints, attempting automatic fix...');
        
        try {
          // Essayer de supprimer les colonnes obsolètes automatiquement
          await pool.query(`
            ALTER TABLE nocodb_config 
            DROP COLUMN IF EXISTS table_id,
            DROP COLUMN IF EXISTS table_name,
            DROP COLUMN IF EXISTS invoice_column_name
          `);
          
          console.log('✅ Obsolete columns removed successfully');
          
          // Réessayer l'insertion
          const result = await pool.query(`
            INSERT INTO nocodb_config (
              name, base_url, project_id, api_token, description, is_active, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `, [
            config.name,
            config.baseUrl,
            config.projectId || '',
            config.apiToken,
            config.description || '',
            config.isActive !== undefined ? config.isActive : true,
            config.createdBy
          ]);
          
          console.log('✅ NocoDB config created after automatic fix:', result.rows[0]);
          return result.rows[0];
          
        } catch (fixError) {
          console.error('❌ Failed to automatically fix table structure:', fixError);
          
          // Dernier recours : insertion avec valeurs par défaut pour les colonnes obsolètes
          try {
            const result = await pool.query(`
              INSERT INTO nocodb_config (
                name, base_url, project_id, api_token, description, is_active, created_by,
                table_id, table_name, invoice_column_name
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              RETURNING *
            `, [
              config.name,
              config.baseUrl,
              config.projectId || '',
              config.apiToken,
              config.description || '',
              config.isActive !== undefined ? config.isActive : true,
              config.createdBy,
              '', // table_id par défaut
              '', // table_name par défaut
              '' // invoice_column_name par défaut
            ]);
            
            console.log('✅ NocoDB config created with legacy compatibility:', result.rows[0]);
            return result.rows[0];
            
          } catch (legacyError) {
            console.error('❌ All insertion methods failed:', legacyError);
            throw error; // Rethrow l'erreur originale
          }
        }
      } else {
        console.error('❌ Error creating NocoDB config:', error);
        throw error;
      }
    }
  }

  async updateNocodbConfig(id: number, config: Partial<InsertNocodbConfig>): Promise<NocodbConfig> {
    const result = await pool.query(`
      UPDATE nocodb_config SET 
        name = $1, base_url = $2, project_id = $3, api_token = $4,
        description = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      config.name,
      config.baseUrl,
      config.projectId,
      config.apiToken,
      config.description || '',
      config.isActive,
      id
    ]);
    return result.rows[0];
  }

  async deleteNocodbConfig(id: number): Promise<void> {
    await pool.query('DELETE FROM nocodb_config WHERE id = $1', [id]);
  }

  // Customer Orders methods
  async getCustomerOrders(groupIds?: number[]): Promise<any[]> {
    let whereClause = '';
    let params = [];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ' WHERE co.group_id = ANY($1)';
      params = [groupIds];
    }

    const result = await pool.query(`
      SELECT co.*, s.name as supplier_name, g.name as group_name, g.color as group_color,
             u.username as creator_username, u.name as creator_name
      FROM customer_orders co
      LEFT JOIN suppliers s ON co.supplier_id = s.id
      LEFT JOIN groups g ON co.group_id = g.id  
      LEFT JOIN users u ON co.created_by = u.id
      ${whereClause}
      ORDER BY co.created_at DESC
    `, params);

    return result.rows.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      groupId: row.group_id,
      groupName: row.group_name,
      groupColor: row.group_color,
      quantity: row.quantity || 1,
      status: row.status,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: {
        username: row.creator_username,
        name: row.creator_name
      },
      supplier: {
        id: row.supplier_id,
        name: row.supplier_name
      },
      group: {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color
      }
    }));
  }

  async getCustomerOrder(id: number): Promise<any> {
    const result = await pool.query(`
      SELECT co.*, s.name as supplier_name, g.name as group_name, g.color as group_color,
             u.username as creator_username, u.name as creator_name
      FROM customer_orders co
      LEFT JOIN suppliers s ON co.supplier_id = s.id
      LEFT JOIN groups g ON co.group_id = g.id
      LEFT JOIN users u ON co.created_by = u.id
      WHERE co.id = $1
    `, [id]);

    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      groupId: row.group_id,
      groupName: row.group_name,
      groupColor: row.group_color,
      quantity: row.quantity || 1,
      status: row.status,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: {
        username: row.creator_username,
        name: row.creator_name
      },
      supplier: {
        id: row.supplier_id,
        name: row.supplier_name
      },
      group: {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color
      }
    };
  }

  async createCustomerOrder(customerOrder: InsertCustomerOrder): Promise<CustomerOrder> {
    const result = await pool.query(`
      INSERT INTO customer_orders (customer_name, customer_phone, customer_email, supplier_id, group_id, quantity, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      customerOrder.customerName,
      customerOrder.customerPhone,
      customerOrder.customerEmail,
      customerOrder.supplierId,
      customerOrder.groupId,
      customerOrder.quantity || 1,
      customerOrder.status || 'En attente de Commande',
      customerOrder.notes,
      customerOrder.createdBy
    ]);
    return result.rows[0];
  }

  async updateCustomerOrder(id: number, customerOrder: Partial<InsertCustomerOrder>): Promise<CustomerOrder> {
    const result = await pool.query(`
      UPDATE customer_orders SET 
        customer_name = $1, customer_phone = $2, customer_email = $3,
        supplier_id = $4, group_id = $5, quantity = $6, status = $7, notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      customerOrder.customerName,
      customerOrder.customerPhone,
      customerOrder.customerEmail,
      customerOrder.supplierId,
      customerOrder.groupId,
      customerOrder.quantity,
      customerOrder.status,
      customerOrder.notes,
      id
    ]);
    return result.rows[0];
  }

  async deleteCustomerOrder(id: number): Promise<void> {
    await pool.query('DELETE FROM customer_orders WHERE id = $1', [id]);
  }

  // 🔧 MÉTHODES MANQUANTES POUR L'AFFICHAGE DES RÔLES
  async getUserWithRoles(userId: string): Promise<any> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;

      const result = await pool.query(`
        SELECT 
          ur.user_id,
          ur.role_id,
          ur.assigned_by,
          ur.assigned_at,
          r.id as role_id,
          r.name as role_name,
          r.display_name as role_display_name,
          r.description as role_description,
          r.color as role_color,
          r.is_system as role_is_system,
          r.is_active as role_is_active,
          r.created_at as role_created_at,
          r.updated_at as role_updated_at
        FROM user_roles ur
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [userId]);

      const userRoleData = result.rows.map(row => ({
        userId: row.user_id,
        roleId: row.role_id,
        assignedBy: row.assigned_by,
        assignedAt: row.assigned_at,
        role: {
          id: row.role_id,
          name: row.role_name,
          displayName: row.role_display_name,
          description: row.role_description,
          color: row.role_color,
          isSystem: row.role_is_system,
          isActive: row.role_is_active,
          createdAt: row.role_created_at,
          updatedAt: row.role_updated_at,
        },
      }));

      console.log(`📊 getUserWithRoles(${userId}):`, { userRoleDataLength: userRoleData.length });

      return {
        ...user,
        userRoles: userRoleData,
      };
    } catch (error) {
      console.error("Error in getUserWithRoles:", error);
      return undefined;
    }
  }

  async getUsersWithRolesAndGroups(): Promise<any[]> {
    console.log('🔍 getUsersWithRolesAndGroups called');
    
    try {
      const baseUsers = await this.getUsers();
      console.log('📊 Base users found:', baseUsers.length);
      
      const usersWithRolesAndGroups = await Promise.all(
        baseUsers.map(async (user) => {
          console.log(`🔍 Processing user: ${user.username}`);
          const userWithRoles = await this.getUserWithRoles(user.id);
          const userWithGroups = await this.getUserWithGroups(user.id);
          
          console.log(`📊 User ${user.username} groups:`, userWithGroups?.userGroups?.length || 0);
          
          return {
            ...user,
            userRoles: userWithRoles?.userRoles || [],
            userGroups: userWithGroups?.userGroups || [],
            roles: userWithRoles?.userRoles?.map(ur => ur.role) || []
          };
        })
      );
      
      console.log('🔍 Final users with roles and groups:', usersWithRolesAndGroups.length);
      return usersWithRolesAndGroups;
    } catch (error) {
      console.error("Error in getUsersWithRolesAndGroups:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
