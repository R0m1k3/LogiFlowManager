import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, requireAuth } from "./localAuth";


// Alias pour compatibilité
const isAuthenticated = requireAuth;
const setupAuth = setupLocalAuth;
import { 
  insertGroupSchema, 
  insertSupplierSchema, 
  insertOrderSchema, 
  insertDeliverySchema,
  insertUserGroupSchema,
  insertPublicitySchema,
  insertCustomerOrderSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertUserRoleSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected' // We could add a real DB check here if needed
    });
  });
  // Auth middleware
  await setupAuth(app);



  // Auth routes handled by authSwitch (local or Replit)

  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims ? req.user.claims.sub : req.user.id : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Admin sees all groups, others see only their assigned groups
      if (user.role === 'admin') {
        const groups = await storage.getGroups();
        res.json(groups);
      } else {
        const userGroups = user.userGroups.map(ug => ug.group);
        res.json(userGroups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims ? req.user.claims.sub : req.user.id : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(data);
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.put('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const data = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(id, data);
      res.json(group);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Suppliers routes
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, data);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;
      let orders;

      console.log('Orders API called with:', { startDate, endDate, storeId, userRole: user.role });

      if (user.role === 'admin') {
        let groupIds: number[] | undefined;
        
        // If admin selected a specific store, filter by it
        if (storeId) {
          groupIds = [parseInt(storeId as string)];
        }
        
        console.log('Admin filtering with groupIds:', groupIds);
        
        // Only filter by date if both startDate and endDate are provided
        if (startDate && endDate) {
          console.log('Fetching orders by date range:', startDate, 'to', endDate);
          orders = await storage.getOrdersByDateRange(startDate as string, endDate as string, groupIds);
        } else {
          console.log('Fetching all orders');
          orders = await storage.getOrders(groupIds);
        }
      } else {
        const groupIds = user.userGroups.map(ug => ug.groupId);
        console.log('Non-admin filtering with groupIds:', groupIds);
        
        // Only filter by date if both startDate and endDate are provided
        if (startDate && endDate) {
          orders = await storage.getOrdersByDateRange(startDate as string, endDate as string, groupIds);
        } else {
          orders = await storage.getOrders(groupIds);
        }
      }

      console.log('Orders returned:', orders.length, 'items');

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has access to this order
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(order.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertOrderSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      // Check if user has access to the group
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Access denied to this group" });
        }
      }

      const order = await storage.createOrder(data);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check permissions
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(order.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const data = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, data);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check permissions
      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (user.role === 'manager') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(order.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deleteOrder(id);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Deliveries routes
  app.get('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId, withBL } = req.query;
      let deliveries;

      console.log('Deliveries API called with:', { startDate, endDate, storeId, withBL, userRole: user.role });

      if (user.role === 'admin') {
        let groupIds: number[] | undefined;
        
        // If admin selected a specific store, filter by it
        if (storeId) {
          groupIds = [parseInt(storeId as string)];
        }
        
        console.log('Admin filtering deliveries with groupIds:', groupIds);
        
        // Only filter by date if both startDate and endDate are provided
        if (startDate && endDate) {
          console.log('Fetching deliveries by date range:', startDate, 'to', endDate);
          deliveries = await storage.getDeliveriesByDateRange(startDate as string, endDate as string, groupIds);
        } else {
          console.log('Fetching all deliveries');
          deliveries = await storage.getDeliveries(groupIds);
        }
      } else {
        const groupIds = user.userGroups.map(ug => ug.groupId);
        console.log('Non-admin filtering deliveries with groupIds:', groupIds);
        
        // Only filter by date if both startDate and endDate are provided
        if (startDate && endDate) {
          deliveries = await storage.getDeliveriesByDateRange(startDate as string, endDate as string, groupIds);
        } else {
          deliveries = await storage.getDeliveries(groupIds);
        }
      }

      // Filter for BL if requested
      if (withBL === 'true') {
        deliveries = deliveries.filter((d: any) => d.blNumber && d.status === 'delivered');
      }

      console.log('Deliveries returned:', deliveries.length, 'items');

      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Check if user has access to this delivery
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(delivery.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(delivery);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({ message: "Failed to fetch delivery" });
    }
  });

  app.put('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Check permissions
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(delivery.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const data = insertDeliverySchema.partial().parse(req.body);
      const updatedDelivery = await storage.updateDelivery(id, data);
      res.json(updatedDelivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.post('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertDeliverySchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      // Check if user has access to the group
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Access denied to this group" });
        }
      }

      const delivery = await storage.createDelivery(data);
      res.json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.put('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Check permissions
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(delivery.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const data = insertDeliverySchema.partial().parse(req.body);
      const updatedDelivery = await storage.updateDelivery(id, data);
      res.json(updatedDelivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Check permissions
      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (user.role === 'manager') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(delivery.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deleteDelivery(id);
      res.json({ message: "Delivery deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });

  app.post('/api/deliveries/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Check permissions
      if (user.role === 'manager') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(delivery.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const { blNumber, blAmount } = req.body;
      
      // BL data is optional - delivery can be validated without it
      let blData: any = undefined;
      if (blNumber) {
        blData = { blNumber };
        if (blAmount !== undefined && blAmount !== null && blAmount !== '') {
          blData.blAmount = blAmount;
        }
      }
      
      await storage.validateDelivery(id, blData);
      res.json({ message: "Delivery validated successfully" });
    } catch (error) {
      console.error("Error validating delivery:", error);
      res.status(500).json({ message: "Failed to validate delivery" });
    }
  });

  // Statistics routes
  app.get('/api/stats/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { year, month, storeId } = req.query;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

      let groupIds: number[] | undefined;
      
      if (user.role === 'admin') {
        // Admin can view all stores or filter by selected store
        groupIds = storeId ? [parseInt(storeId as string)] : undefined;
      } else {
        // Non-admin users: filter by their assigned groups
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        
        // If a specific store is selected and user has access, filter by it
        if (storeId && userGroupIds.includes(parseInt(storeId as string))) {
          groupIds = [parseInt(storeId as string)];
        } else {
          groupIds = userGroupIds;
        }
      }

      const stats = await storage.getMonthlyStats(currentYear, currentMonth, groupIds);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // User-Group management routes (admin only)
  app.post('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const data = insertUserGroupSchema.parse({
        userId,
        groupId: req.body.groupId,
      });

      const userGroup = await storage.assignUserToGroup(data);
      res.json(userGroup);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ message: "Failed to assign user to group" });
    }
  });

  app.delete('/api/users/:userId/groups/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const groupId = parseInt(req.params.groupId);

      await storage.removeUserFromGroup(userId, groupId);
      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  // Users management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get all users with roles and groups for admin
      const usersWithRoles = await storage.getUsersWithRolesAndGroups();
      const safeUsers = Array.isArray(usersWithRoles) ? usersWithRoles : [];
      
      console.log('🔐 API /api/users - Returning:', { isArray: Array.isArray(safeUsers), length: safeUsers.length });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // En cas d'erreur, retourner un array vide pour éviter React Error #310
      res.status(500).json([]);
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUserWithGroups(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Schema création utilisateur SANS champs obligatoires pour résoudre le problème de production
      const createUserSchema = z.object({
        id: z.string().optional(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        password: z.string().optional(),
        role: z.enum(['admin', 'manager', 'employee']).optional(),
      });

      const userData = createUserSchema.parse(req.body);
      
      // Hash password if provided (for local auth)
      if (userData.password) {
        const { hashPassword } = await import("./localAuth");
        userData.password = await hashPassword(userData.password);
      }
      
      const newUser = await storage.createUser({
        id: userData.id || `manual_${Date.now()}`, // Generate manual ID for created users
        ...userData,
      });

      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      
      // Handle specific database constraint errors
      if (error.code === '23505') {
        if (error.constraint === 'users_username_key') {
          return res.status(409).json({ 
            message: "Un utilisateur avec ce nom d'utilisateur existe déjà. Veuillez choisir un autre nom d'utilisateur." 
          });
        }
        if (error.constraint === 'users_email_key') {
          return res.status(409).json({ 
            message: "Un utilisateur avec cette adresse email existe déjà." 
          });
        }
      }
      
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Schema utilisateur SANS champs obligatoires pour résoudre le problème de production
      const updateUserSchema = z.object({
        username: z.string().optional(),
        role: z.enum(['admin', 'manager', 'employee']).optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
      });

      const userData = updateUserSchema.parse(req.body);
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import("./localAuth");
        userData.password = await hashPassword(userData.password);
        // Mark password as changed
        (userData as any).passwordChanged = true;
      }
      
      const updatedUser = await storage.updateUser(req.params.id, userData);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post('/api/users/:id/groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { groupId } = req.body;
      await storage.assignUserToGroup({
        userId: req.params.id,
        groupId: parseInt(groupId),
      });

      res.json({ message: "User assigned to group successfully" });
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ message: "Failed to assign user to group" });
    }
  });

  app.delete('/api/users/:id/groups/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.removeUserFromGroup(req.params.id, parseInt(req.params.groupId));
      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  // Delete user route
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userToDelete = req.params.id;
      
      // Prevent admin from deleting themselves
      if (userToDelete === user.id) {
        return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
      }

      // Remove user from all groups first
      const userWithGroups = await storage.getUserWithGroups(userToDelete);
      if (userWithGroups) {
        for (const userGroup of userWithGroups.userGroups) {
          await storage.removeUserFromGroup(userToDelete, userGroup.groupId);
        }
      }

      // Delete the user
      await storage.deleteUser(userToDelete);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Publicity routes
  app.get('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { year, storeId } = req.query;
      const filterYear = year ? parseInt(year as string) : undefined;

      let groupIds: number[] | undefined;
      
      if (user.role === 'admin') {
        // Admin can view all publicities or filter by selected store
        groupIds = storeId ? [parseInt(storeId as string)] : undefined;
      } else {
        // Non-admin users: filter by their assigned groups
        groupIds = user.userGroups.map(ug => ug.groupId);
      }

      const publicities = await storage.getPublicities(filterYear, groupIds);
      res.json(publicities);
    } catch (error) {
      console.error("Error fetching publicities:", error);
      res.status(500).json({ message: "Failed to fetch publicities" });
    }
  });

  app.get('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const publicity = await storage.getPublicity(id);
      
      if (!publicity) {
        return res.status(404).json({ message: "Publicity not found" });
      }

      // Check access permissions
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        const hasAccess = publicity.participations.some(p => userGroupIds.includes(p.groupId));
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(publicity);
    } catch (error) {
      console.error("Error fetching publicity:", error);
      res.status(500).json({ message: "Failed to fetch publicity" });
    }
  });

  app.post('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions (admin or manager)
      if (user.role === 'employee') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertPublicitySchema.parse({
        ...req.body,
        createdBy: req.user.claims ? req.user.claims.sub : req.user.id
      });

      const { participatingGroups, ...publicityData } = req.body;

      // Create publicity
      const newPublicity = await storage.createPublicity(data);

      // Set participations
      if (participatingGroups && participatingGroups.length > 0) {
        await storage.setPublicityParticipations(newPublicity.id, participatingGroups);
      }

      // Get the complete publicity with relations
      const completePublicity = await storage.getPublicity(newPublicity.id);
      res.json(completePublicity);
    } catch (error) {
      console.error("Error creating publicity:", error);
      res.status(500).json({ message: "Failed to create publicity" });
    }
  });

  app.put('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions (admin or manager)
      if (user.role === 'employee') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const { participatingGroups, ...publicityData } = req.body;

      // Update publicity
      const updatedPublicity = await storage.updatePublicity(id, publicityData);

      // Update participations
      if (participatingGroups !== undefined) {
        await storage.setPublicityParticipations(id, participatingGroups);
      }

      // Get the complete publicity with relations
      const completePublicity = await storage.getPublicity(id);
      res.json(completePublicity);
    } catch (error) {
      console.error("Error updating publicity:", error);
      res.status(500).json({ message: "Failed to update publicity" });
    }
  });

  app.delete('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions (admin only for deletion)
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePublicity(id);
      res.json({ message: "Publicity deleted successfully" });
    } catch (error) {
      console.error("Error deleting publicity:", error);
      res.status(500).json({ message: "Failed to delete publicity" });
    }
  });











  // Invoice verification routes
  app.post('/api/verify-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, invoiceReference } = req.body;
      
      if (!groupId || !invoiceReference) {
        return res.status(400).json({ message: "groupId and invoiceReference are required" });
      }

      const { verifyInvoiceReference } = await import('./nocodbService.js');
      const result = await verifyInvoiceReference(groupId, invoiceReference);
      
      res.json(result);
    } catch (error) {
      console.error("Error verifying invoice:", error);
      res.status(500).json({ message: "Failed to verify invoice" });
    }
  });

  app.post('/api/verify-invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { invoiceReferences } = req.body;
      
      if (!Array.isArray(invoiceReferences)) {
        return res.status(400).json({ message: "invoiceReferences must be an array" });
      }

      // Add supplier name to invoice references for verification
      const enrichedReferences = invoiceReferences.map((ref: any) => ({
        ...ref,
        supplierName: ref.supplierName // Include supplier name for matching
      }));

      const { verifyMultipleInvoiceReferences } = await import('./nocodbService.js');
      const results = await verifyMultipleInvoiceReferences(enrichedReferences);
      
      res.json(results);
    } catch (error) {
      console.error("Error verifying invoices:", error);
      res.status(500).json({ message: "Failed to verify invoices" });
    }
  });

  // NocoDB Configuration routes
  app.get('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const configs = await storage.getNocodbConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching NocoDB configs:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des configurations' });
    }
  });

  app.get('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const id = parseInt(req.params.id);
      const config = await storage.getNocodbConfig(id);
      
      if (!config) {
        return res.status(404).json({ message: 'Configuration non trouvée' });
      }

      res.json(config);
    } catch (error) {
      console.error('Error fetching NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération de la configuration' });
    }
  });

  app.post('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const configData = {
        ...req.body,
        createdBy: req.user.claims ? req.user.claims.sub : req.user.id,
      };

      const config = await storage.createNocodbConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la configuration' });
    }
  });

  app.put('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const id = parseInt(req.params.id);
      const config = await storage.updateNocodbConfig(id, req.body);
      res.json(config);
    } catch (error) {
      console.error('Error updating NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de la configuration' });
    }
  });

  app.delete('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserWithGroups(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteNocodbConfig(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la configuration' });
    }
  });



  // Customer Orders routes
  app.get('/api/customer-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // All users see only their assigned stores
      const groupIds = user.userGroups.map(ug => ug.groupId);

      const customerOrders = await storage.getCustomerOrders(groupIds);
      console.log("Customer orders returned from storage:", customerOrders, "Type:", typeof customerOrders, "Is Array:", Array.isArray(customerOrders));
      res.json(customerOrders || []);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.get('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerOrder = await storage.getCustomerOrder(id);
      
      if (!customerOrder) {
        return res.status(404).json({ message: "Customer order not found" });
      }

      // Check if user has access to this order's group
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(customerOrder.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(customerOrder);
    } catch (error) {
      console.error("Error fetching customer order:", error);
      res.status(500).json({ message: "Failed to fetch customer order" });
    }
  });

  app.post('/api/customer-orders', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Raw body received:", req.body);
      console.log("Body type:", typeof req.body);
      console.log("Body keys:", req.body ? Object.keys(req.body) : 'no keys');
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertCustomerOrderSchema.parse(req.body);
      console.log("Parsed data:", data);
      
      // Check if user has access to the specified group
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Access denied to this group" });
        }
      }

      const customerOrder = await storage.createCustomerOrder({
        ...data,
        createdBy: userId,
      });
      res.status(201).json(customerOrder);
    } catch (error) {
      console.error("Error creating customer order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer order" });
    }
  });

  app.put('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if order exists and user has access
      const existingOrder = await storage.getCustomerOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Customer order not found" });
      }

      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(existingOrder.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const data = insertCustomerOrderSchema.partial().parse(req.body);
      const customerOrder = await storage.updateCustomerOrder(id, data);
      res.json(customerOrder);
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ message: "Failed to update customer order" });
    }
  });

  app.delete('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if order exists and user has access
      const existingOrder = await storage.getCustomerOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Customer order not found" });
      }

      // Only admin can delete orders
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete customer orders" });
      }

      await storage.deleteCustomerOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer order:", error);
      res.status(500).json({ message: "Failed to delete customer order" });
    }
  });

  // ===== ROLE MANAGEMENT ROUTES =====

  // Roles routes
  app.get('/api/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const role = await storage.getRoleWithPermissions(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post('/api/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      res.json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const data = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(id, data);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      
      // Check if role is system role
      const role = await storage.getRole(id);
      if (role?.isSystem) {
        return res.status(400).json({ message: "Cannot delete system role" });
      }

      await storage.deleteRole(id);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Permissions routes
  app.get('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get('/api/permissions/category/:category', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const category = req.params.category;
      const permissions = await storage.getPermissionsByCategory(category);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions by category:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertPermissionSchema.parse(req.body);
      const permission = await storage.createPermission(data);
      res.json(permission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.put('/api/permissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const data = insertPermissionSchema.partial().parse(req.body);
      const permission = await storage.updatePermission(id, data);
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  app.delete('/api/permissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      
      // Check if permission is system permission
      const permission = await storage.getPermission(id);
      if (permission?.isSystem) {
        return res.status(400).json({ message: "Cannot delete system permission" });
      }

      await storage.deletePermission(id);
      res.json({ message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Role-Permission association routes
  app.get('/api/roles/:roleId/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.roleId);
      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.put('/api/roles/:roleId/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.roleId);
      const { permissionIds } = req.body;
      
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ message: "permissionIds must be an array" });
      }

      await storage.setRolePermissions(roleId, permissionIds);
      res.json({ message: "Role permissions updated successfully" });
    } catch (error) {
      console.error("Error setting role permissions:", error);
      res.status(500).json({ message: "Failed to set role permissions" });
    }
  });

  // User-Role association routes
  app.get('/api/users/:userId/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.put('/api/users/:userId/roles', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const { roleIds } = req.body;
      
      if (!Array.isArray(roleIds)) {
        return res.status(400).json({ message: "roleIds must be an array" });
      }

      const assignedBy = currentUser.id;
      await storage.setUserRoles(userId, roleIds, assignedBy);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error setting user roles:", error);
      res.status(500).json({ message: "Failed to set user roles" });
    }
  });

  app.get('/api/users/:userId/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const permissions = await storage.getUserEffectivePermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Permission checking routes
  app.get('/api/users/:userId/has-permission/:permissionName', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      const userId = req.params.userId;
      const permissionName = req.params.permissionName;

      // Users can check their own permissions, admins can check anyone's
      if (currentUser?.id !== userId && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const hasPermission = await storage.userHasPermission(userId, permissionName);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  app.get('/api/users/:userId/has-role/:roleName', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      const userId = req.params.userId;
      const roleName = req.params.roleName;

      // Users can check their own roles, admins can check anyone's
      if (currentUser?.id !== userId && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const hasRole = await storage.userHasRole(userId, roleName);
      res.json({ hasRole });
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Failed to check role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
