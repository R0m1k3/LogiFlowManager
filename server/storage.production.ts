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
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        password: users.password,
        passwordChanged: users.passwordChanged,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        userGroups: {
          id: userGroups.id,
          userId: userGroups.userId,
          groupId: userGroups.groupId,
          assignedAt: userGroups.assignedAt,
          group: {
            id: groups.id,
            name: groups.name,
            color: groups.color,
            createdAt: groups.createdAt,
            updatedAt: groups.updatedAt,
          }
        }
      })
      .from(users)
      .leftJoin(userGroups, eq(users.id, userGroups.userId))
      .leftJoin(groups, eq(userGroups.groupId, groups.id))
      .where(eq(users.id, id));

    if (result.length === 0) return undefined;

    const user = {
      id: result[0].id,
      username: result[0].username,
      email: result[0].email,
      name: result[0].name,
      role: result[0].role,
      password: result[0].password,
      passwordChanged: result[0].passwordChanged,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
      userGroups: result
        .filter(r => r.userGroups.id !== null)
        .map(r => ({
          id: r.userGroups.id!,
          userId: r.userGroups.userId!,
          groupId: r.userGroups.groupId!,
          assignedAt: r.userGroups.assignedAt!,
          group: r.userGroups.group!
        }))
    };

    return user as UserWithGroups;
  }

  async getUsers(): Promise<UserWithGroups[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        password: users.password,
        passwordChanged: users.passwordChanged,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        userGroupId: userGroups.id,
        userGroupUserId: userGroups.userId,
        userGroupGroupId: userGroups.groupId,
        userGroupAssignedAt: userGroups.assignedAt,
        groupId: groups.id,
        groupName: groups.name,
        groupColor: groups.color,
        groupCreatedAt: groups.createdAt,
        groupUpdatedAt: groups.updatedAt,
      })
      .from(users)
      .leftJoin(userGroups, eq(users.id, userGroups.userId))
      .leftJoin(groups, eq(userGroups.groupId, groups.id))
      .orderBy(desc(users.createdAt));

    // Group by user ID to consolidate user groups
    const usersMap = new Map<string, UserWithGroups>();
    
    for (const row of result) {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          username: row.username,
          email: row.email,
          name: row.name,
          role: row.role,
          password: row.password,
          passwordChanged: row.passwordChanged,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          userGroups: []
        });
      }
      
      const user = usersMap.get(row.id)!;
      
      // Add user group if it exists
      if (row.userGroupId && row.groupId) {
        user.userGroups.push({
          id: row.userGroupId,
          userId: row.userGroupUserId!,
          groupId: row.userGroupGroupId!,
          assignedAt: row.userGroupAssignedAt!,
          group: {
            id: row.groupId,
            name: row.groupName!,
            color: row.groupColor!,
            createdAt: row.groupCreatedAt!,
            updatedAt: row.groupUpdatedAt!,
          }
        });
      }
    }
    
    return Array.from(usersMap.values());
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
    return await db.select().from(groups).orderBy(groups.name);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    return result[0];
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