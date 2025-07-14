import {
  users,
  groups,
  suppliers,
  orders,
  deliveries,
  userGroups,
  publicities,
  publicityParticipations,
  roles,
  permissions,
  rolePermissions,
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
  type Publicity,
  type InsertPublicity,
  type PublicityParticipation,
  type InsertPublicityParticipation,
  type PublicityWithRelations,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission,
  type RoleWithPermissions,
  nocodbConfig,
  type NocodbConfig,
  type InsertNocodbConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - supports both Replit Auth and local auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithGroups(id: string): Promise<UserWithGroups | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Group operations
  getGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
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

  // Publicity operations
  getPublicities(year?: number, groupIds?: number[]): Promise<PublicityWithRelations[]>;
  getPublicity(id: number): Promise<PublicityWithRelations | undefined>;
  createPublicity(publicity: InsertPublicity): Promise<Publicity>;
  updatePublicity(id: number, publicity: Partial<InsertPublicity>): Promise<Publicity>;
  deletePublicity(id: number): Promise<void>;
  
  // Publicity participation operations
  getPublicityParticipations(publicityId: number): Promise<PublicityParticipation[]>;
  setPublicityParticipations(publicityId: number, groupIds: number[]): Promise<void>;

  // Role operations
  getRoles(): Promise<RoleWithPermissions[]>;
  getRole(id: number): Promise<RoleWithPermissions | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  
  // Permission operations
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  // Role-Permission operations
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  setRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;
  
  // NocoDB Configuration operations
  getNocodbConfigs(): Promise<NocodbConfig[]>;
  getNocodbConfig(id: number): Promise<NocodbConfig | undefined>;
  createNocodbConfig(config: InsertNocodbConfig): Promise<NocodbConfig>;
  updateNocodbConfig(id: number, config: Partial<InsertNocodbConfig>): Promise<NocodbConfig>;
  deleteNocodbConfig(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(groups.name);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
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
      orderBy: [desc(orders.createdAt)],
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
      orderBy: [desc(orders.createdAt)],
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
      orderBy: [desc(deliveries.createdAt)],
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
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate),
          inArray(deliveries.groupId, groupIds)
        )
      : and(
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate)
        );

    const results = await db.query.deliveries.findMany({
      with: {
        supplier: true,
        group: true,
        creator: true,
        order: true,
      },
      where: whereCondition,
      orderBy: [desc(deliveries.createdAt)],
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
    
    // Si la livraison est liée à une commande, mettre à jour le statut de la commande
    if (newDelivery.orderId) {
      await db
        .update(orders)
        .set({ status: 'planned' })
        .where(eq(orders.id, newDelivery.orderId));
    }
    
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

  async validateDelivery(id: number, blData?: { blNumber: string; blAmount: number }): Promise<void> {
    const delivery = await this.getDelivery(id);
    if (!delivery) throw new Error("Delivery not found");
    
    const now = new Date();
    
    // Prepare update data
    const updateData: any = { 
      status: "delivered",
      deliveredDate: now,
      validatedAt: now,
      updatedAt: now
    };
    
    // Add BL data if provided
    if (blData && blData.blNumber && blData.blAmount !== undefined) {
      updateData.blNumber = blData.blNumber;
      updateData.blAmount = blData.blAmount.toString();
    }
    
    // Update delivery status and set delivered date
    await db
      .update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id));
    
    // Update linked order status if exists
    if (delivery.orderId) {
      await db
        .update(orders)
        .set({ 
          status: "delivered",
          updatedAt: now
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
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate),
          inArray(deliveries.groupId, groupIds)
        )
      : and(
          gte(deliveries.scheduledDate, startDate),
          lte(deliveries.scheduledDate, endDate)
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

  // Publicity operations
  async getPublicities(year?: number, groupIds?: number[]): Promise<PublicityWithRelations[]> {
    const query = db.select({
      id: publicities.id,
      pubNumber: publicities.pubNumber,
      designation: publicities.designation,
      startDate: publicities.startDate,
      endDate: publicities.endDate,
      year: publicities.year,
      createdBy: publicities.createdBy,
      createdAt: publicities.createdAt,
      updatedAt: publicities.updatedAt,
      creator: {
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role
      }
    })
    .from(publicities)
    .innerJoin(users, eq(publicities.createdBy, users.id))
    .orderBy(desc(publicities.createdAt));

    if (year) {
      query.where(eq(publicities.year, year));
    }

    const results = await query;
    
    // Récupérer les participations séparément
    const publicityIds = results.map(pub => pub.id);
    const participations = publicityIds.length > 0 ? await db.select({
      publicityId: publicityParticipations.publicityId,
      groupId: publicityParticipations.groupId,
      group: {
        id: groups.id,
        name: groups.name,
        color: groups.color
      }
    })
    .from(publicityParticipations)
    .innerJoin(groups, eq(publicityParticipations.groupId, groups.id))
    .where(inArray(publicityParticipations.publicityId, publicityIds)) : [];

    // Associer les participations aux publicités
    return results.map(pub => ({
      ...pub,
      participations: participations
        .filter(p => p.publicityId === pub.id)
        .map(p => ({ 
          publicityId: p.publicityId, 
          groupId: p.groupId, 
          group: p.group,
          createdAt: new Date()
        }))
    })) as PublicityWithRelations[];
  }

  async getPublicity(id: number): Promise<PublicityWithRelations | undefined> {
    const publicity = await db.select({
      id: publicities.id,
      pubNumber: publicities.pubNumber,
      designation: publicities.designation,
      startDate: publicities.startDate,
      endDate: publicities.endDate,
      year: publicities.year,
      createdBy: publicities.createdBy,
      createdAt: publicities.createdAt,
      updatedAt: publicities.updatedAt,
      creator: {
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role
      }
    })
    .from(publicities)
    .innerJoin(users, eq(publicities.createdBy, users.id))
    .where(eq(publicities.id, id))
    .limit(1);

    if (publicity.length === 0) return undefined;

    const participations = await db.select({
      publicityId: publicityParticipations.publicityId,
      groupId: publicityParticipations.groupId,
      group: {
        id: groups.id,
        name: groups.name,
        color: groups.color
      }
    })
    .from(publicityParticipations)
    .innerJoin(groups, eq(publicityParticipations.groupId, groups.id))
    .where(eq(publicityParticipations.publicityId, id));

    return {
      ...publicity[0],
      participations: participations.map(p => ({ 
        publicityId: p.publicityId, 
        groupId: p.groupId, 
        group: p.group,
        createdAt: new Date()
      }))
    } as PublicityWithRelations;
  }

  async createPublicity(publicity: InsertPublicity): Promise<Publicity> {
    const [newPublicity] = await db.insert(publicities).values(publicity).returning();
    return newPublicity;
  }

  async updatePublicity(id: number, publicity: Partial<InsertPublicity>): Promise<Publicity> {
    const [updatedPublicity] = await db.update(publicities)
      .set({ ...publicity, updatedAt: new Date() })
      .where(eq(publicities.id, id))
      .returning();
    return updatedPublicity;
  }

  async deletePublicity(id: number): Promise<void> {
    await db.delete(publicities).where(eq(publicities.id, id));
  }

  async getPublicityParticipations(publicityId: number): Promise<PublicityParticipation[]> {
    return await db.select()
      .from(publicityParticipations)
      .where(eq(publicityParticipations.publicityId, publicityId));
  }

  async setPublicityParticipations(publicityId: number, groupIds: number[]): Promise<void> {
    // Supprimer les participations existantes
    await db.delete(publicityParticipations)
      .where(eq(publicityParticipations.publicityId, publicityId));

    // Ajouter les nouvelles participations
    if (groupIds.length > 0) {
      const participations = groupIds.map(groupId => ({
        publicityId,
        groupId
      }));
      await db.insert(publicityParticipations).values(participations);
    }
  }

  // Role operations
  async getRoles(): Promise<RoleWithPermissions[]> {
    const rolesData = await db.query.roles.findMany({
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
      orderBy: [roles.name],
    });
    return rolesData;
  }

  async getRole(id: number): Promise<RoleWithPermissions | undefined> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    const [updatedRole] = await db.update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: number): Promise<void> {
    // Supprimer d'abord les permissions associées
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    // Puis supprimer le rôle
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Permission operations
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.name);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  // Role-Permission operations
  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  }

  async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Supprimer les permissions existantes
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Ajouter les nouvelles permissions
    if (permissionIds.length > 0) {
      const permissions = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      await db.insert(rolePermissions).values(permissions);
    }
  }

  // NocoDB Configuration operations
  async getNocodbConfigs(): Promise<NocodbConfig[]> {
    return await db.select().from(nocodbConfig).orderBy(desc(nocodbConfig.createdAt));
  }

  async getNocodbConfig(id: number): Promise<NocodbConfig | undefined> {
    const configs = await db.select().from(nocodbConfig).where(eq(nocodbConfig.id, id));
    return configs[0];
  }

  async createNocodbConfig(config: InsertNocodbConfig): Promise<NocodbConfig> {
    const [newConfig] = await db.insert(nocodbConfig).values(config).returning();
    return newConfig;
  }

  async updateNocodbConfig(id: number, config: Partial<InsertNocodbConfig>): Promise<NocodbConfig> {
    const [updatedConfig] = await db.update(nocodbConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(nocodbConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteNocodbConfig(id: number): Promise<void> {
    await db.delete(nocodbConfig).where(eq(nocodbConfig.id, id));
  }
}

export const storage = new DatabaseStorage();
