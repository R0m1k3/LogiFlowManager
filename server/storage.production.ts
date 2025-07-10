import { eq, and, inArray, desc, gte, lte, sql } from "drizzle-orm";
import { 
  users, 
  groups, 
  suppliers, 
  orders, 
  deliveries, 
  userGroups,
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
import { db } from "./db.production";

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
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      const result = await db
        .update(users)
        .set({
          name: userData.name,
          email: userData.email,
          username: userData.username,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    }
  }

  async getUserWithGroups(id: string): Promise<UserWithGroups | undefined> {
    console.log('🔍 Storage getUserWithGroups called for:', id);
    
    try {
      // Use raw SQL to avoid Drizzle ORM issues
      const userResult = await db.execute(sql`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at 
        FROM users 
        WHERE id = ${id} 
        LIMIT 1
      `);
      
      if (userResult.length === 0) {
        console.log('❌ User not found:', id);
        return undefined;
      }
      
      const user = userResult[0];
      console.log('✅ User found:', user.username);
      
      // Get user groups with raw SQL
      const userGroupsResult = await db.execute(sql`
        SELECT 
          ug.user_id,
          ug.group_id,
          ug.created_at as assigned_at,
          g.name as group_name,
          g.color as group_color,
          g.created_at as group_created_at,
          g.updated_at as group_updated_at
        FROM user_groups ug
        LEFT JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = ${id}
      `);
      
      console.log('✅ User groups found:', userGroupsResult.length);
      
      const userWithGroups: UserWithGroups = {
        id: user.id as string,
        username: user.username as string,
        email: user.email as string,
        name: user.name as string,
        role: user.role as 'admin' | 'manager' | 'employee',
        password: user.password as string,
        passwordChanged: user.password_changed as boolean,
        createdAt: new Date(user.created_at as string),
        updatedAt: new Date(user.updated_at as string),
        userGroups: userGroupsResult.map(ug => ({
          id: `${ug.user_id}-${ug.group_id}`,
          userId: ug.user_id as string,
          groupId: ug.group_id as number,
          assignedAt: new Date(ug.assigned_at as string),
          group: ug.group_name ? {
            id: ug.group_id as number,
            name: ug.group_name as string,
            color: ug.group_color as string,
            createdAt: new Date(ug.group_created_at as string),
            updatedAt: new Date(ug.group_updated_at as string),
          } : undefined
        })).filter(ug => ug.group !== undefined) as any[]
      };
      
      return userWithGroups;
    } catch (error) {
      console.error('❌ Error in getUserWithGroups:', error);
      throw error;
    }
  }

  async getUsers(): Promise<UserWithGroups[]> {
    console.log('🔍 Storage getUsers called');
    
    try {
      // First get all users - simple query without joins
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      console.log('✅ Basic users query returned:', allUsers.length, 'users');
      
      if (allUsers.length === 0) {
        console.log('❌ No users found in database');
        return [];
      }
      
      // Then get user groups for each user
      const usersWithGroups: UserWithGroups[] = [];
      
      for (const user of allUsers) {
        console.log('🔍 Processing user:', user.id, user.username);
        
        try {
          // Get user groups for this user
          const userGroupsData = await db
            .select({
              id: userGroups.id,
              userId: userGroups.userId,
              groupId: userGroups.groupId,
              assignedAt: userGroups.assignedAt,
              groupName: groups.name,
              groupColor: groups.color,
              groupCreatedAt: groups.createdAt,
              groupUpdatedAt: groups.updatedAt,
            })
            .from(userGroups)
            .leftJoin(groups, eq(userGroups.groupId, groups.id))
            .where(eq(userGroups.userId, user.id));
          
          console.log('✅ User groups for', user.username, ':', userGroupsData.length);
          
          // Build user with groups
          const userWithGroups: UserWithGroups = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            passwordChanged: user.passwordChanged,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            userGroups: userGroupsData.map(ug => ({
              id: ug.id,
              userId: ug.userId,
              groupId: ug.groupId,
              assignedAt: ug.assignedAt,
              group: ug.groupName ? {
                id: ug.groupId,
                name: ug.groupName,
                color: ug.groupColor!,
                createdAt: ug.groupCreatedAt!,
                updatedAt: ug.groupUpdatedAt!,
              } : undefined
            })).filter(ug => ug.group !== undefined) as any[]
          };
          
          usersWithGroups.push(userWithGroups);
        } catch (error) {
          console.error('❌ Error processing user groups for', user.username, ':', error);
          // Add user without groups if groups query fails
          usersWithGroups.push({
            ...user,
            userGroups: []
          });
        }
      }
      
      console.log('✅ Final users with groups:', usersWithGroups.length);
      return usersWithGroups;
      
    } catch (error) {
      console.error('❌ Error in getUsers:', error);
      throw error;
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(userGroups).where(eq(userGroups.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getGroups(): Promise<Group[]> {
    console.log('🔍 Storage getGroups called');
    
    try {
      // Raw SQL query to avoid Drizzle ORM issues
      const result = await db.execute(sql`
        SELECT id, name, color, created_at, updated_at 
        FROM groups 
        ORDER BY name
      `);
      
      console.log('✅ Groups query returned:', result.length, 'groups');
      
      if (result.length === 0) {
        console.log('❌ No groups found in database');
        return [];
      }
      
      const groups = result.map(row => ({
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
      const result = await db.insert(groups).values(group).returning();
      console.log('✅ Group created in database:', result[0]);
      return result[0];
    } catch (error) {
      console.error('❌ Error creating group in database:', error);
      throw error;
    }
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group> {
    const result = await db
      .update(groups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return result[0];
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(userGroups).where(eq(userGroups.groupId, id));
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const result = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
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
      
      const results = params.length > 0 
        ? await db.execute(sql`${sql.raw(sqlQuery)}`, params)
        : await db.execute(sql`${sql.raw(sqlQuery)}`);
      
      const orders = results.map(row => ({
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
    let query = db
      .select({
        id: orders.id,
        supplierId: orders.supplierId,
        groupId: orders.groupId,
        plannedDate: orders.plannedDate,
        status: orders.status,
        notes: orders.notes,
        createdBy: orders.createdBy,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.contact,
          email: suppliers.email,
          phone: suppliers.phone,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt,
        },
        group: {
          id: groups.id,
          name: groups.name,
          color: groups.color,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          password: users.password,
          passwordChanged: users.passwordChanged,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(orders)
      .innerJoin(suppliers, eq(orders.supplierId, suppliers.id))
      .innerJoin(groups, eq(orders.groupId, groups.id))
      .innerJoin(users, eq(orders.createdBy, users.id))
      .where(
        and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate),
          groupIds && groupIds.length > 0 ? inArray(orders.groupId, groupIds) : undefined
        )
      );

    const results = await query.orderBy(desc(orders.createdAt));

    return results.map(result => ({
      ...result,
      deliveries: []
    })) as OrderWithRelations[];
  }

  async getOrder(id: number): Promise<OrderWithRelations | undefined> {
    const result = await db
      .select({
        id: orders.id,
        supplierId: orders.supplierId,
        groupId: orders.groupId,
        plannedDate: orders.plannedDate,
        status: orders.status,
        notes: orders.notes,
        createdBy: orders.createdBy,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.contact,
          email: suppliers.email,
          phone: suppliers.phone,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt,
        },
        group: {
          id: groups.id,
          name: groups.name,
          color: groups.color,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          password: users.password,
          passwordChanged: users.passwordChanged,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(orders)
      .innerJoin(suppliers, eq(orders.supplierId, suppliers.id))
      .innerJoin(groups, eq(orders.groupId, groups.id))
      .innerJoin(users, eq(orders.createdBy, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0],
      deliveries: []
    } as OrderWithRelations;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const result = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getDeliveries(groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    let query = db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        supplierId: deliveries.supplierId,
        groupId: deliveries.groupId,
        scheduledDate: deliveries.scheduledDate,
        quantity: deliveries.quantity,
        unit: deliveries.unit,
        status: deliveries.status,
        notes: deliveries.notes,
        blNumber: deliveries.blNumber,
        blAmount: deliveries.blAmount,
        invoiceReference: deliveries.invoiceReference,
        invoiceAmount: deliveries.invoiceAmount,
        reconciled: deliveries.reconciled,
        createdBy: deliveries.createdBy,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.contact,
          email: suppliers.email,
          phone: suppliers.phone,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt,
        },
        group: {
          id: groups.id,
          name: groups.name,
          color: groups.color,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          password: users.password,
          passwordChanged: users.passwordChanged,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(deliveries)
      .innerJoin(suppliers, eq(deliveries.supplierId, suppliers.id))
      .innerJoin(groups, eq(deliveries.groupId, groups.id))
      .innerJoin(users, eq(deliveries.createdBy, users.id));

    if (groupIds && groupIds.length > 0) {
      query = query.where(inArray(deliveries.groupId, groupIds));
    }

    const results = await query.orderBy(desc(deliveries.createdAt));

    return results.map(result => ({
      ...result,
      order: null
    })) as DeliveryWithRelations[];
  }

  async getDeliveriesByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    let query = db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        supplierId: deliveries.supplierId,
        groupId: deliveries.groupId,
        scheduledDate: deliveries.scheduledDate,
        quantity: deliveries.quantity,
        unit: deliveries.unit,
        status: deliveries.status,
        notes: deliveries.notes,
        blNumber: deliveries.blNumber,
        blAmount: deliveries.blAmount,
        invoiceReference: deliveries.invoiceReference,
        invoiceAmount: deliveries.invoiceAmount,
        reconciled: deliveries.reconciled,
        createdBy: deliveries.createdBy,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.contact,
          email: suppliers.email,
          phone: suppliers.phone,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt,
        },
        group: {
          id: groups.id,
          name: groups.name,
          color: groups.color,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          password: users.password,
          passwordChanged: users.passwordChanged,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(deliveries)
      .innerJoin(suppliers, eq(deliveries.supplierId, suppliers.id))
      .innerJoin(groups, eq(deliveries.groupId, groups.id))
      .innerJoin(users, eq(deliveries.createdBy, users.id))
      .where(
        and(
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate),
          groupIds && groupIds.length > 0 ? inArray(deliveries.groupId, groupIds) : undefined
        )
      );

    const results = await query.orderBy(desc(deliveries.createdAt));

    return results.map(result => ({
      ...result,
      order: null
    })) as DeliveryWithRelations[];
  }

  async getDelivery(id: number): Promise<DeliveryWithRelations | undefined> {
    const result = await db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        supplierId: deliveries.supplierId,
        groupId: deliveries.groupId,
        scheduledDate: deliveries.scheduledDate,
        quantity: deliveries.quantity,
        unit: deliveries.unit,
        status: deliveries.status,
        notes: deliveries.notes,
        blNumber: deliveries.blNumber,
        blAmount: deliveries.blAmount,
        invoiceReference: deliveries.invoiceReference,
        invoiceAmount: deliveries.invoiceAmount,
        reconciled: deliveries.reconciled,
        createdBy: deliveries.createdBy,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.contact,
          email: suppliers.email,
          phone: suppliers.phone,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt,
        },
        group: {
          id: groups.id,
          name: groups.name,
          color: groups.color,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          role: users.role,
          password: users.password,
          passwordChanged: users.passwordChanged,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(deliveries)
      .innerJoin(suppliers, eq(deliveries.supplierId, suppliers.id))
      .innerJoin(groups, eq(deliveries.groupId, groups.id))
      .innerJoin(users, eq(deliveries.createdBy, users.id))
      .where(eq(deliveries.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0],
      order: null
    } as DeliveryWithRelations;
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const result = await db.insert(deliveries).values(delivery).returning();
    return result[0];
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const result = await db
      .update(deliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();
    return result[0];
  }

  async deleteDelivery(id: number): Promise<void> {
    await db.delete(deliveries).where(eq(deliveries.id, id));
  }

  async validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void> {
    await db
      .update(deliveries)
      .set({
        status: 'delivered',
        blNumber: blData?.blNumber,
        blAmount: blData?.blAmount,
        updatedAt: new Date()
      })
      .where(eq(deliveries.id, id));
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    return await db.select().from(userGroups).where(eq(userGroups.userId, userId));
  }

  async assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup> {
    const result = await db.insert(userGroups).values(userGroup).returning();
    return result[0];
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<void> {
    await db.delete(userGroups).where(
      and(
        eq(userGroups.userId, userId),
        eq(userGroups.groupId, groupId)
      )
    );
  }

  async getMonthlyStats(year: number, month: number, groupIds?: number[]): Promise<{
    ordersCount: number;
    deliveriesCount: number;
    pendingOrdersCount: number;
    averageDeliveryTime: number;
    totalPalettes: number;
    totalPackages: number;
  }> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    let ordersQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
    let deliveriesQuery = db.select({ count: sql<number>`count(*)` }).from(deliveries);
    let pendingOrdersQuery = db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'pending'));

    if (groupIds && groupIds.length > 0) {
      ordersQuery = ordersQuery.where(
        and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate),
          inArray(orders.groupId, groupIds)
        )
      );
      deliveriesQuery = deliveriesQuery.where(
        and(
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate),
          inArray(deliveries.groupId, groupIds)
        )
      );
      pendingOrdersQuery = pendingOrdersQuery.where(
        and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate),
          inArray(orders.groupId, groupIds)
        )
      );
    } else {
      ordersQuery = ordersQuery.where(
        and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate)
        )
      );
      deliveriesQuery = deliveriesQuery.where(
        and(
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate)
        )
      );
      pendingOrdersQuery = pendingOrdersQuery.where(
        and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate)
        )
      );
    }

    const [ordersResult, deliveriesResult, pendingOrdersResult] = await Promise.all([
      ordersQuery,
      deliveriesQuery,
      pendingOrdersQuery
    ]);

    return {
      ordersCount: Number(ordersResult[0]?.count || 0),
      deliveriesCount: Number(deliveriesResult[0]?.count || 0),
      pendingOrdersCount: Number(pendingOrdersResult[0]?.count || 0),
      averageDeliveryTime: 0,
      totalPalettes: 0,
      totalPackages: 0,
    };
  }
}

export const storage = new DatabaseStorage();