import { eq, and, inArray, desc, sql, gte, lte } from "drizzle-orm";
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
      // First get the user
      const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (user.length === 0) {
        console.log('❌ User not found:', id);
        return undefined;
      }
      
      console.log('✅ User found:', user[0].username);
      
      // Then get user groups separately
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
        .where(eq(userGroups.userId, id));
      
      console.log('✅ User groups found:', userGroupsData.length);
      
      const userWithGroups: UserWithGroups = {
        ...user[0],
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
      const result = await db.select().from(groups).orderBy(groups.name);
      console.log('✅ Groups query returned:', result.length, 'groups');
      
      if (result.length === 0) {
        console.log('❌ No groups found in database');
      } else {
        console.log('✅ Groups found:', result.map(g => ({ id: g.id, name: g.name })));
      }
      
      return result;
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
      .innerJoin(users, eq(orders.createdBy, users.id));

    if (groupIds && groupIds.length > 0) {
      query = query.where(inArray(orders.groupId, groupIds));
    }

    const results = await query.orderBy(desc(orders.createdAt));

    return results.map(result => ({
      ...result,
      deliveries: []
    })) as OrderWithRelations[];
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