import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupLocalAuth, requireAuth } from "./localAuth.production";
import { 
  insertGroupSchema, 
  insertSupplierSchema, 
  insertOrderSchema, 
  insertDeliverySchema,
  insertUserGroupSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Import du storage de production avec PostgreSQL standard
  const { storage } = await import("./storage.production.js");

  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      auth: 'local',
      database: 'connected'
    });
  });
  
  // Debug routes for troubleshooting
  app.get('/api/debug/status', (req, res) => {
    res.json({
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 5000,
      headers: req.headers,
      ip: req.ip || req.socket.remoteAddress,
      protocol: req.protocol,
      hostname: req.hostname,
      originalUrl: req.originalUrl,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + ' seconds'
    });
  });
  
  app.get('/api/debug/echo', (req, res) => {
    console.log('📥 Echo request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query
    });
    
    res.json({
      echo: 'success',
      received: {
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });
  });
  
  app.get('/api/debug/db', async (req, res) => {
    try {
      const { db } = await import('./db.production.js');
      const result = await db.execute('SELECT NOW() as now, version() as version');
      res.json({
        connected: true,
        timestamp: result.rows[0].now,
        version: result.rows[0].version
      });
    } catch (error) {
      console.error('Database debug error:', error);
      res.status(500).json({
        connected: false,
        error: error.message
      });
    }
  });

  // Setup ONLY local authentication in production
  console.log('Using local authentication system');
  setupLocalAuth(app);

  // Auth middleware - using only local auth
  const isAuthenticated = requireAuth;

  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
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
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
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

  // Users routes - Get all users (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - admin only" });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get current user profile
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userData = req.body;
      const newUser = await storage.createUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = req.params.id;
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = req.params.id;
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User-Group management
  app.post('/api/user-groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertUserGroupSchema.parse(req.body);
      const userGroup = await storage.assignUserToGroup(data);
      res.json(userGroup);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ message: "Failed to assign user to group" });
    }
  });

  app.delete('/api/user-groups/:userId/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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

  // Default credentials check
  app.get('/api/default-credentials-check', async (req, res) => {
    try {
      const defaultUser = await storage.getUserByUsername('admin');
      if (!defaultUser) {
        return res.json({ showDefault: false });
      }
      
      const showDefault = !defaultUser.passwordChanged;
      res.json({ showDefault });
    } catch (error) {
      console.error("Error checking default credentials:", error);
      res.json({ showDefault: false });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;
      
      let groupIds: number[] | undefined;
      if (user.role !== 'admin') {
        groupIds = user.userGroups.map(ug => ug.groupId);
      } else if (storeId && storeId !== 'all') {
        groupIds = [parseInt(storeId as string)];
      }

      let orders;
      if (startDate && endDate) {
        orders = await storage.getOrdersByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        orders = await storage.getOrders(groupIds);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertOrderSchema.parse({
        ...req.body,
        createdBy: userId
      });

      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Insufficient permissions for this group" });
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
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (user.role !== 'admin' && existingOrder.createdBy !== userId) {
        return res.status(403).json({ message: "Can only edit your own orders" });
      }

      const data = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, data);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (user.role !== 'admin' && existingOrder.createdBy !== userId) {
        return res.status(403).json({ message: "Can only delete your own orders" });
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
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId, withBL } = req.query;
      
      let groupIds: number[] | undefined;
      if (user.role !== 'admin') {
        groupIds = user.userGroups.map(ug => ug.groupId);
      } else if (storeId && storeId !== 'all') {
        groupIds = [parseInt(storeId as string)];
      }

      let deliveries;
      if (startDate && endDate) {
        deliveries = await storage.getDeliveriesByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        deliveries = await storage.getDeliveries(groupIds);
      }

      if (withBL === 'true') {
        deliveries = deliveries.filter(d => d.status === 'delivered' && d.blNumber);
      }
      
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertDeliverySchema.parse({
        ...req.body,
        createdBy: userId
      });

      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Insufficient permissions for this group" });
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
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const existingDelivery = await storage.getDelivery(id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      if (user.role !== 'admin' && existingDelivery.createdBy !== userId) {
        return res.status(403).json({ message: "Can only edit your own deliveries" });
      }

      const data = insertDeliverySchema.partial().parse(req.body);
      const delivery = await storage.updateDelivery(id, data);
      res.json(delivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const existingDelivery = await storage.getDelivery(id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      if (user.role !== 'admin' && existingDelivery.createdBy !== userId) {
        return res.status(403).json({ message: "Can only delete your own deliveries" });
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
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const id = parseInt(req.params.id);
      const { blNumber, blAmount } = req.body;
      
      await storage.validateDelivery(id, { blNumber, blAmount });
      res.json({ message: "Delivery validated successfully" });
    } catch (error) {
      console.error("Error validating delivery:", error);
      res.status(500).json({ message: "Failed to validate delivery" });
    }
  });

  // Stats routes
  app.get('/api/stats/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let groupIds: number[] | undefined;
      if (user.role !== 'admin') {
        groupIds = user.userGroups.map(ug => ug.groupId);
      }

      const stats = await storage.getMonthlyStats(year, month, groupIds);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return createServer(app);
}