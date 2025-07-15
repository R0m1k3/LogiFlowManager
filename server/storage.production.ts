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

    const groupsResult = await pool.query(`
      SELECT g.*, ug.user_id, ug.group_id 
      FROM groups g 
      JOIN user_groups ug ON g.id = ug.group_id 
      WHERE ug.user_id = $1
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
      }))
    };
  }

  async getUsers(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
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
    
    // Validation des champs obligatoires
    if (userData.firstName && !userData.firstName.trim()) {
      throw new Error('Le prénom ne peut pas être vide');
    }
    if (userData.lastName && !userData.lastName.trim()) {
      throw new Error('Le nom ne peut pas être vide');
    }
    if (userData.email && !userData.email.trim()) {
      throw new Error('L\'email ne peut pas être vide');
    }
    if (userData.email && !userData.email.includes('@')) {
      throw new Error('L\'email doit être valide');
    }
    
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined && value !== null && value !== '') {
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
      throw new Error('Aucun champ à mettre à jour');
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (!result.rows[0]) {
      throw new Error('Utilisateur non trouvé');
    }
    
    console.log('✅ updateUser success:', { id, fieldsUpdated: fields.length });
    return result.rows[0];
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
    const result = await pool.query(`
      INSERT INTO groups (name, color) 
      VALUES ($1, $2) 
      RETURNING *
    `, [group.name, group.color]);
    return result.rows[0];
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
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact, phone) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [supplier.name, supplier.contact || '', supplier.phone || '']);
    return result.rows[0];
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
    let whereClause = '';
    let params = [];
    
    if (groupIds && groupIds.length > 0) {
      whereClause = ' WHERE o.group_id = ANY($1)';
      params = [groupIds];
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
    await pool.query('DELETE FROM deliveries WHERE id = $1', [id]);
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
    const result = await pool.query(`
      INSERT INTO user_groups (user_id, group_id) 
      VALUES ($1, $2) 
      ON CONFLICT (user_id, group_id) DO NOTHING
      RETURNING *
    `, [userGroup.userId, userGroup.groupId]);
    return result.rows[0];
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

  // Roles and permissions methods
  async getRoles(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT r.*, 
               rp.permission_id,
               p.name as permission_name,
               p.display_name as permission_display_name,
               p.description as permission_description,
               p.category as permission_category,
               p.action as permission_action,
               p.created_at as permission_created_at,
               p.updated_at as permission_updated_at
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        ORDER BY r.name, p.category, p.name
      `);
      
      console.log('🔍 getRoles debug:', { resultType: typeof result.rows, isArray: Array.isArray(result.rows), length: result.rows?.length });
      console.log('🔍 First result row:', result.rows?.[0] ? {
        id: result.rows[0].id,
        name: result.rows[0].name,
        permission_id: result.rows[0].permission_id,
        permission_name: result.rows[0].permission_name
      } : 'No rows');
      
      // Protection critique contre null/undefined
      if (!result || !result.rows) {
        console.warn('⚠️ getRoles: result.rows is null/undefined');
        return [];
      }
      
      // Protection et transformation en structure Drizzle avec permissions imbriquées
      const rolesMap = new Map();
      const rows = Array.isArray(result.rows) ? result.rows : [];
      console.log('🔍 Processing rows:', rows.length);
      
      rows.forEach((row, index) => {
      const roleId = row.id;
      console.log(`🔍 Row ${index}:`, {
        roleId: row.id, 
        roleName: row.name, 
        permissionId: row.permission_id,
        permissionName: row.permission_name
      });
      
      if (!rolesMap.has(roleId)) {
        rolesMap.set(roleId, {
          id: row.id,
          name: row.name,
          displayName: row.display_name || row.name,
          description: row.description || '',
          color: row.color || '#6b7280',
          isActive: row.is_active !== false,
          isSystem: row.is_system || false,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          permissions: [],
          rolePermissions: []
        });
      }
      
      // Ajouter permission si elle existe - STRUCTURE COMPATIBLE FRONTEND
      if (row.permission_id) {
        const permission = {
          id: row.permission_id,
          name: row.permission_name,
          displayName: row.permission_display_name || row.permission_name || '',  // ✅ Utilise display_name de BDD
          description: row.permission_description,
          category: row.permission_category,
          action: row.permission_action || row.permission_name || '',             // ✅ Utilise action de BDD
          createdAt: row.permission_created_at || row.created_at,
          updatedAt: row.permission_updated_at || row.updated_at
        };
        
        rolesMap.get(roleId).permissions.push(permission);
        rolesMap.get(roleId).rolePermissions.push({
          roleId: roleId,
          permissionId: row.permission_id
        });
      }
    });
    
    const finalRoles = Array.from(rolesMap.values());
    console.log('✅ getRoles final result:', { isArray: Array.isArray(finalRoles), length: finalRoles.length });
    return finalRoles;
    } catch (error) {
      console.error('❌ getRoles error:', error);
      return []; // Toujours retourner un array vide en cas d'erreur
    }
  }

  async getRole(id: number): Promise<any> {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const result = await pool.query(`
      INSERT INTO roles (name, display_name, description, color, is_active, is_system) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [
      role.name, 
      role.displayName || role.name, 
      role.description || '', 
      role.color || '#6b7280',
      role.isActive !== false,
      role.isSystem || false
    ]);
    return result.rows[0];
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    const result = await pool.query(`
      UPDATE roles SET 
        name = $1, 
        display_name = $2, 
        description = $3, 
        color = $4, 
        is_active = $5, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      role.name, 
      role.displayName, 
      role.description, 
      role.color, 
      role.isActive,
      id
    ]);
    return result.rows[0];
  }

  async deleteRole(id: number): Promise<void> {
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      const result = await pool.query('SELECT * FROM permissions ORDER BY category, name');
      console.log('🔍 getPermissions debug:', { resultType: typeof result.rows, isArray: Array.isArray(result.rows), length: result.rows?.length });
      
      // Protection critique contre null/undefined
      if (!result || !result.rows) {
        console.warn('⚠️ getPermissions: result.rows is null/undefined');
        return [];
      }
      
      // Protection contre null/undefined et transformation structure COMPATIBLE FRONTEND
      const permissions = Array.isArray(result.rows) ? result.rows : [];
      const finalPermissions = permissions.map(perm => ({
        id: perm.id,
        name: perm.name || '',
        displayName: perm.display_name || perm.name || '',  // ✅ Ajout displayName manquant
        description: perm.description || '',
        category: perm.category || 'other',
        action: perm.action || perm.name || '',            // ✅ Ajout action manquant  
        createdAt: perm.created_at,
        updatedAt: perm.updated_at
      }));
      
      console.log('✅ getPermissions final result:', { isArray: Array.isArray(finalPermissions), length: finalPermissions.length });
      return finalPermissions;
    } catch (error) {
      console.error('❌ getPermissions error:', error);
      return []; // Toujours retourner un array vide en cas d'erreur
    }
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    const result = await pool.query('SELECT * FROM role_permissions WHERE role_id = $1', [roleId]);
    return result.rows.map(row => ({
      roleId: row.role_id,
      permissionId: row.permission_id
    }));
  }

  async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Supprimer les permissions existantes
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    
    // Ajouter les nouvelles permissions
    for (const permissionId of permissionIds) {
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [roleId, permissionId]);
    }
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await pool.query(`
      INSERT INTO permissions (name, description, category) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [permission.name, permission.description, permission.category]);
    return result.rows[0];
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    const result = await pool.query('SELECT * FROM role_permissions WHERE role_id = $1', [roleId]);
    console.log('🔍 getRolePermissions debug:', { roleId, resultType: typeof result.rows, isArray: Array.isArray(result.rows), length: result.rows?.length });
    
    // Protection contre null/undefined et transformation structure
    const rolePermissions = result.rows || [];
    return Array.isArray(rolePermissions) ? rolePermissions.map(rp => ({
      roleId: rp.role_id,
      permissionId: rp.permission_id,
      createdAt: rp.created_at
    })) : [];
  }

  async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    
    for (const permissionId of permissionIds) {
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES ($1, $2)
      `, [roleId, permissionId]);
    }
  }

  // NocoDB Config methods
  async getNocodbConfigs(): Promise<NocodbConfig[]> {
    const result = await pool.query('SELECT * FROM nocodb_config ORDER BY name');
    return result.rows;
  }

  async getNocodbConfig(id: number): Promise<NocodbConfig | undefined> {
    const result = await pool.query('SELECT * FROM nocodb_config WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async createNocodbConfig(config: InsertNocodbConfig): Promise<NocodbConfig> {
    const result = await pool.query(`
      INSERT INTO nocodb_config (name, base_url, project_id, table_id, table_name, invoice_column_name, api_token, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      config.name,
      config.baseUrl,
      config.projectId,
      config.tableId,
      config.tableName,
      config.invoiceColumnName,
      config.apiToken,
      config.isActive,
      config.createdBy
    ]);
    return result.rows[0];
  }

  async updateNocodbConfig(id: number, config: Partial<InsertNocodbConfig>): Promise<NocodbConfig> {
    const result = await pool.query(`
      UPDATE nocodb_config SET 
        name = $1, base_url = $2, project_id = $3, table_id = $4, 
        table_name = $5, invoice_column_name = $6, api_token = $7, 
        is_active = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      config.name,
      config.baseUrl,
      config.projectId,
      config.tableId,
      config.tableName,
      config.invoiceColumnName,
      config.apiToken,
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
      SELECT co.*, 
             s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.phone as supplier_phone,
             g.id as group_id, g.name as group_name, g.color as group_color,
             u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name
      FROM customer_orders co
      LEFT JOIN suppliers s ON co.supplier_id = s.id
      LEFT JOIN groups g ON co.group_id = g.id
      LEFT JOIN users u ON co.created_by = u.id
      ${whereClause}
      ORDER BY co.created_at DESC
    `, params);
    
    // Transformer pour correspondre exactement à la structure Drizzle
    const transformedData = (result.rows || []).map(row => ({
      id: row.id,
      orderTaker: row.order_taker,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      productDesignation: row.product_designation,
      productReference: row.product_reference,
      gencode: row.gencode,
      quantity: row.quantity,
      supplierId: row.supplier_id,
      status: row.status,
      deposit: row.deposit,
      isPromotionalPrice: row.is_promotional_price,
      customerNotified: row.customer_notified,
      groupId: row.group_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact || '',
        phone: row.supplier_phone || ''
      } : null,
      group: row.group_name ? {
        id: row.group_id,
        name: row.group_name,
        color: row.group_color || '#666666'
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
    
    console.log('Customer orders returned from storage:', transformedData, 'Type:', typeof transformedData, 'Is Array:', Array.isArray(transformedData));
    return transformedData;
  }

  async getCustomerOrder(id: number): Promise<any> {
    const result = await pool.query(`
      SELECT co.*, s.name as supplier_name, g.name as group_name, g.color as group_color,
             u.username as creator_username
      FROM customer_orders co
      JOIN suppliers s ON co.supplier_id = s.id
      JOIN groups g ON co.group_id = g.id
      JOIN users u ON co.created_by = u.id
      WHERE co.id = $1
    `, [id]);
    return result.rows[0] || undefined;
  }

  async createCustomerOrder(customerOrder: InsertCustomerOrder): Promise<CustomerOrder> {
    const result = await pool.query(`
      INSERT INTO customer_orders (
        order_taker, customer_name, customer_phone, product_designation, 
        product_reference, gencode, quantity, supplier_id, status, deposit, 
        is_promotional_price, customer_notified, group_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      customerOrder.orderTaker,
      customerOrder.customerName,
      customerOrder.customerPhone,
      customerOrder.productDesignation,
      customerOrder.productReference,
      customerOrder.gencode,
      customerOrder.quantity,
      customerOrder.supplierId,
      customerOrder.status,
      customerOrder.deposit,
      customerOrder.isPromotionalPrice,
      customerOrder.customerNotified,
      customerOrder.groupId,
      customerOrder.createdBy
    ]);
    return result.rows[0];
  }

  async updateCustomerOrder(id: number, customerOrder: Partial<InsertCustomerOrder>): Promise<CustomerOrder> {
    const result = await pool.query(`
      UPDATE customer_orders SET 
        order_taker = $1, customer_name = $2, customer_phone = $3, 
        product_designation = $4, product_reference = $5, gencode = $6, 
        quantity = $7, supplier_id = $8, status = $9, deposit = $10, 
        is_promotional_price = $11, customer_notified = $12, group_id = $13, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      customerOrder.orderTaker,
      customerOrder.customerName,
      customerOrder.customerPhone,
      customerOrder.productDesignation,
      customerOrder.productReference,
      customerOrder.gencode,
      customerOrder.quantity,
      customerOrder.supplierId,
      customerOrder.status,
      customerOrder.deposit,
      customerOrder.isPromotionalPrice,
      customerOrder.customerNotified,
      customerOrder.groupId,
      id
    ]);
    return result.rows[0];
  }

  async deleteCustomerOrder(id: number): Promise<void> {
    await pool.query('DELETE FROM customer_orders WHERE id = $1', [id]);
  }
}

export const storage = new DatabaseStorage();