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
      const { pool } = await import('./db.production.js');
      const result = await pool.query('SELECT NOW() as now, version() as version');
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

  console.log("🔧 ROUTES: Ensuring database is ready before auth...");
  
  // Double-check database is initialized before auth setup
  try {
    const { initializeDatabase } = await import("./initDatabase.production.js");
    await initializeDatabase();
    console.log("✅ ROUTES: Database confirmed ready");
  } catch (error) {
    console.error("❌ ROUTES: Database initialization failed:", error);
    throw error;
  }

  // Setup ONLY local authentication in production
  console.log('Using local authentication system');
  setupLocalAuth(app);

  // Auth middleware - using only local auth
  const isAuthenticated = requireAuth;

  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 Groups API called, user ID:', req.user?.id);
      
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      console.log('🔍 Current user found:', user ? { id: user.id, role: user.role } : 'null');
      
      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({ message: "User not found" });
      }

      // Admin sees all groups, others see only their assigned groups
      if (user.role === 'admin') {
        console.log('✅ User is admin, fetching all groups...');
        const groups = await storage.getGroups();
        console.log('✅ Groups fetched for admin, count:', groups.length);
        res.json(groups);
      } else {
        console.log('✅ User is not admin, fetching user groups...');
        const userGroups = user.userGroups.map(ug => ug.group);
        console.log('✅ User groups fetched, count:', userGroups.length);
        res.json(userGroups);
      }
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 Create group API called, user ID:', req.user?.id);
      console.log('🔍 Group data to create:', req.body);
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      console.log('🔍 Current user found:', user ? { id: user.id, role: user.role } : 'null');
      
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        console.log('❌ Access denied - insufficient permissions');
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertGroupSchema.parse(req.body);
      console.log('✅ Group data validated:', data);
      
      const group = await storage.createGroup(data);
      console.log('✅ Group created successfully:', group);
      
      res.json(group);
    } catch (error) {
      console.error("❌ Error creating group:", error);
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
      console.log('🔍 Users API called, user ID:', req.user?.id);
      
      const user = await storage.getUser(req.user.id);
      console.log('🔍 Current user found:', user ? { id: user.id, role: user.role } : 'null');
      
      if (!user || user.role !== 'admin') {
        console.log('❌ Access denied - user is not admin');
        return res.status(403).json({ message: "Access denied - admin only" });
      }

      console.log('✅ User is admin, fetching all users...');
      const users = await storage.getUsers();
      console.log('✅ Users fetched successfully, count:', users.length);
      
      res.json(users);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
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

      console.log('🔍 Creating user with data:', req.body);
      
      // Convert frontend data to backend format
      const userData = { ...req.body };
      
      // Generate username if not provided (usually email prefix)
      if (!userData.username && userData.email) {
        userData.username = userData.email.split('@')[0];
      }
      
      // Convert firstName/lastName to name field
      if (userData.firstName && userData.lastName) {
        userData.name = `${userData.firstName} ${userData.lastName}`.trim();
        delete userData.firstName;
        delete userData.lastName;
      }
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import("./localAuth.production.js");
        userData.password = await hashPassword(userData.password);
        userData.passwordChanged = false; // New users need to change password
      }
      
      // Generate ID if not provided
      if (!userData.id) {
        userData.id = `user_${Date.now()}`;
      }
      
      console.log('🔍 Processed user data:', userData);
      
      const newUser = await storage.createUser(userData);
      
      // Convert back for frontend response
      const [firstName = '', ...lastNameParts] = (newUser.name || '').split(' ');
      const lastName = lastNameParts.join(' ');
      
      res.json({
        ...newUser,
        firstName,
        lastName
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const id = req.params.id;
      
      // Allow users to update their own profile OR admins to update any profile
      if (!user || (user.role !== 'admin' && user.id !== id)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      console.log('🔍 Updating user:', id, 'with data:', req.body);
      
      // Convert firstName/lastName to name field for database
      const userData = { ...req.body };
      if (userData.firstName && userData.lastName) {
        userData.name = `${userData.firstName} ${userData.lastName}`.trim();
        // Remove frontend-specific fields
        delete userData.firstName;
        delete userData.lastName;
      }
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import("./localAuth.production.js");
        userData.password = await hashPassword(userData.password);
        userData.passwordChanged = true; // Mark password as changed
        console.log('🔒 Password hashed for user update');
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      console.log('✅ User updated successfully:', updatedUser);
      
      // Convert back for frontend
      const [firstName = '', ...lastNameParts] = (updatedUser.name || '').split(' ');
      const lastName = lastNameParts.join(' ');
      
      res.json({
        ...updatedUser,
        firstName,
        lastName
      });
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
      const { year, month, storeId } = req.query;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      
      const userId = req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let groupIds: number[] | undefined;
      
      if (user.role === 'admin') {
        // Admin can view all stores or filter by selected store
        if (storeId && storeId !== 'all') {
          groupIds = [parseInt(storeId as string)];
        }
        // If no storeId or storeId === 'all', groupIds remains undefined (all groups)
      } else {
        // Non-admin users: filter by their assigned groups
        const userGroupIds = user.userGroups.map(ug => ug.groupId);
        
        // If a specific store is selected and user has access, filter by it
        if (storeId && storeId !== 'all' && userGroupIds.includes(parseInt(storeId as string))) {
          groupIds = [parseInt(storeId as string)];
        } else {
          groupIds = userGroupIds;
        }
      }

      console.log('🔍 Stats API called:', { userId, year: currentYear, month: currentMonth, storeId, groupIds });
      
      const stats = await storage.getMonthlyStats(currentYear, currentMonth, groupIds);
      
      console.log('✅ Stats computed:', stats);
      
      res.json(stats);
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return createServer(app);
}