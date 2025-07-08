import {
  users,
  groups,
  suppliers,
  orders,
  deliveries,
  userGroups,
  type User,
  type UpsertUser,
  type Group,
  type InsertGroup,
  type Supplier,
  type InsertSupplier,
  type Order,
  type InsertOrder,
  type Delivery,
  type InsertDelivery,
  type UserGroup,
  type InsertUserGroup,
  type OrderWithRelations,
  type DeliveryWithRelations,
  type UserWithGroups,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithGroups(id: string): Promise<UserWithGroups | undefined>;
  
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
  validateDelivery(id: number): Promise<void>;
  
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
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithGroups(id: string): Promise<UserWithGroups | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        userGroups: {
          with: {
            group: true,
          },
        },
      },
    });
    return user;
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(groups.name);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Order operations
  async getOrders(groupIds?: number[]): Promise<OrderWithRelations[]> {
    const ordersQuery = db.query.orders.findMany({
      with: {
        supplier: true,
        group: true,
        creator: true,
        deliveries: true,
      },
      orderBy: [desc(orders.plannedDate)],
      where: groupIds ? inArray(orders.groupId, groupIds) : undefined,
    });
    
    return await ordersQuery;
  }

  async getOrdersByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<OrderWithRelations[]> {
    const whereCondition = groupIds 
      ? and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate),
          inArray(orders.groupId, groupIds)
        )
      : and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate)
        );

    return await db.query.orders.findMany({
      with: {
        supplier: true,
        group: true,
        creator: true,
        deliveries: true,
      },
      where: whereCondition,
      orderBy: [orders.plannedDate],
    });
  }

  async getOrder(id: number): Promise<OrderWithRelations | undefined> {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        supplier: true,
        group: true,
        creator: true,
        deliveries: true,
      },
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Delivery operations
  async getDeliveries(groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    const results = await db.query.deliveries.findMany({
      with: {
        supplier: true,
        group: true,
        creator: true,
        order: true,
      },
      orderBy: [desc(deliveries.plannedDate)],
      where: groupIds ? inArray(deliveries.groupId, groupIds) : undefined,
    });
    
    return results.map(result => ({
      ...result,
      order: result.order || undefined,
    }));
  }

  async getDeliveriesByDateRange(startDate: string, endDate: string, groupIds?: number[]): Promise<DeliveryWithRelations[]> {
    const whereCondition = groupIds 
      ? and(
          gte(deliveries.plannedDate, startDate),
          lte(deliveries.plannedDate, endDate),
          inArray(deliveries.groupId, groupIds)
        )
      : and(
          gte(deliveries.plannedDate, startDate),
          lte(deliveries.plannedDate, endDate)
        );

    const results = await db.query.deliveries.findMany({
      with: {
        supplier: true,
        group: true,
        creator: true,
        order: true,
      },
      where: whereCondition,
      orderBy: [deliveries.plannedDate],
    });
    
    return results.map(result => ({
      ...result,
      order: result.order || undefined,
    }));
  }

  async getDelivery(id: number): Promise<DeliveryWithRelations | undefined> {
    const result = await db.query.deliveries.findFirst({
      where: eq(deliveries.id, id),
      with: {
        supplier: true,
        group: true,
        creator: true,
        order: true,
      },
    });
    
    if (!result) return undefined;
    
    return {
      ...result,
      order: result.order || undefined,
    };
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
    return newDelivery;
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const [updatedDelivery] = await db
      .update(deliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();
    return updatedDelivery;
  }

  async deleteDelivery(id: number): Promise<void> {
    await db.delete(deliveries).where(eq(deliveries.id, id));
  }

  async validateDelivery(id: number): Promise<void> {
    const delivery = await this.getDelivery(id);
    if (!delivery) throw new Error("Delivery not found");
    
    // Update delivery status and set delivered date
    await db
      .update(deliveries)
      .set({ 
        status: "delivered",
        deliveredDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deliveries.id, id));
    
    // Update linked order status if exists
    if (delivery.orderId) {
      await db
        .update(orders)
        .set({ 
          status: "delivered",
          updatedAt: new Date()
        })
        .where(eq(orders.id, delivery.orderId));
    }
  }

  // User-Group operations
  async getUserGroups(userId: string): Promise<UserGroup[]> {
    return await db.select().from(userGroups).where(eq(userGroups.userId, userId));
  }

  async assignUserToGroup(userGroup: InsertUserGroup): Promise<UserGroup> {
    const [newUserGroup] = await db.insert(userGroups).values(userGroup).returning();
    return newUserGroup;
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<void> {
    await db.delete(userGroups).where(
      and(
        eq(userGroups.userId, userId),
        eq(userGroups.groupId, groupId)
      )
    );
  }

  // Statistics
  async getMonthlyStats(year: number, month: number, groupIds?: number[]): Promise<{
    ordersCount: number;
    deliveriesCount: number;
    pendingOrdersCount: number;
    averageDeliveryTime: number;
    totalPalettes: number;
    totalPackages: number;
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    // Build where conditions
    const orderWhere = groupIds 
      ? and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate),
          inArray(orders.groupId, groupIds)
        )
      : and(
          gte(orders.plannedDate, startDate),
          lte(orders.plannedDate, endDate)
        );

    const deliveryWhere = groupIds 
      ? and(
          gte(deliveries.plannedDate, startDate),
          lte(deliveries.plannedDate, endDate),
          inArray(deliveries.groupId, groupIds)
        )
      : and(
          gte(deliveries.plannedDate, startDate),
          lte(deliveries.plannedDate, endDate)
        );

    // Get counts and totals
    const [orderStats] = await db
      .select({
        count: sql<number>`count(*)`,
        pendingCount: sql<number>`count(*) filter (where status = 'pending')`,
        totalPalettes: sql<number>`sum(case when unit = 'palettes' then quantity else 0 end)`,
        totalPackages: sql<number>`sum(case when unit = 'colis' then quantity else 0 end)`,
      })
      .from(orders)
      .where(orderWhere);

    const [deliveryStats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalPalettes: sql<number>`sum(case when unit = 'palettes' then quantity else 0 end)`,
        totalPackages: sql<number>`sum(case when unit = 'colis' then quantity else 0 end)`,
      })
      .from(deliveries)
      .where(deliveryWhere);

    // Calculate average delivery time
    const deliveredOrders = await db
      .select({
        plannedDate: orders.plannedDate,
        deliveredDate: deliveries.deliveredDate,
      })
      .from(orders)
      .innerJoin(deliveries, eq(orders.id, deliveries.orderId))
      .where(
        and(
          orderWhere,
          eq(deliveries.status, 'delivered')
        )
      );

    let averageDeliveryTime = 0;
    if (deliveredOrders.length > 0) {
      const totalDelayDays = deliveredOrders.reduce((sum, order) => {
        if (order.deliveredDate && order.plannedDate) {
          const planned = new Date(order.plannedDate);
          const delivered = new Date(order.deliveredDate);
          const diffTime = delivered.getTime() - planned.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      averageDeliveryTime = totalDelayDays / deliveredOrders.length;
    }

    return {
      ordersCount: orderStats?.count || 0,
      deliveriesCount: deliveryStats?.count || 0,
      pendingOrdersCount: orderStats?.pendingCount || 0,
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
      totalPalettes: (orderStats?.totalPalettes || 0) + (deliveryStats?.totalPalettes || 0),
      totalPackages: (orderStats?.totalPackages || 0) + (deliveryStats?.totalPackages || 0),
    };
  }
}

export const storage = new DatabaseStorage();
