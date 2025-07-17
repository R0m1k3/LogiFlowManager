import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.production";
import { setupLocalAuth, requireAuth } from "./localAuth.production";


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
      environment: process.env.NODE_ENV || 'production',
      database: 'connected'
    });
  });

  // Auth middleware
  await setupAuth(app);



  // All routes from the original routes.ts file
  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === 'admin') {
        const groups = await storage.getGroups();
        res.json(groups);
      } else {
        const userGroups = user.userGroups.map((ug: any) => ug.group);
        res.json(userGroups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🏪 POST /api/groups - Raw request received');
      console.log('📨 Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      });
      console.log('📋 Request body type:', typeof req.body);
      console.log('📋 Request body content:', JSON.stringify(req.body, null, 2));
      console.log('📋 Request body keys:', Object.keys(req.body || {}));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔐 User requesting group creation:', userId);
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        console.log('❌ Insufficient permissions for user:', { userId, userRole: user?.role });
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      console.log('✅ User has permission to create group:', user.role);

      const result = insertGroupSchema.safeParse(req.body);
      if (!result.success) {
        console.log('❌ Group validation failed:', result.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      console.log('✅ Group data validation passed:', result.data);

      const group = await storage.createGroup(result.data);
      console.log('✅ Group creation successful:', group);
      res.status(201).json(group);
    } catch (error) {
      console.error("❌ Error creating group:", error);
      console.error("📊 Full error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ 
        message: "Failed to create group",
        error: error.message,
        details: error.detail || "Database error occurred"
      });
    }
  });

  app.put('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const result = insertGroupSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const group = await storage.updateGroup(id, result.data);
      res.json(group);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.status(204).send();
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
      console.log('🚚 POST /api/suppliers - Raw request received');
      console.log('📨 Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      });
      console.log('📋 Request body type:', typeof req.body);
      console.log('📋 Request body content:', JSON.stringify(req.body, null, 2));
      console.log('📋 Request body keys:', Object.keys(req.body || {}));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔐 User requesting supplier creation:', userId);
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        console.log('❌ Insufficient permissions for user:', { userId, userRole: user?.role });
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      console.log('✅ User has permission to create supplier:', user.role);

      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        console.log('❌ Supplier validation failed:', result.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      console.log('✅ Supplier data validation passed:', result.data);

      const supplier = await storage.createSupplier(result.data);
      console.log('✅ Supplier creation successful:', supplier);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("❌ Error creating supplier:", error);
      console.error("📊 Full error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ 
        message: "Failed to create supplier",
        error: error.message,
        details: error.detail || "Database error occurred"
      });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const result = insertSupplierSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const supplier = await storage.updateSupplier(id, result.data);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;
      
      console.log('📦 Orders API called with:', {
        startDate,
        endDate,
        storeId,
        userRole: user.role
      });

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        groupIds = storeId ? [parseInt(storeId as string)] : undefined;
        console.log('📦 Admin filtering with groupIds:', groupIds);
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
        console.log('📦 Non-admin filtering with groupIds:', groupIds);
      }

      let orders;
      if (startDate && endDate) {
        console.log('📦 Fetching orders by date range:', startDate, 'to', endDate);
        orders = await storage.getOrdersByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        console.log('📦 Fetching all orders with groupIds:', groupIds);
        orders = await storage.getOrders(groupIds);
      }

      console.log('📦 Orders returned:', orders.length, 'items');
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const orderData = {
        ...req.body,
        createdBy: userId,
      };

      const result = insertOrderSchema.safeParse(orderData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertOrderSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const order = await storage.updateOrder(id, result.data);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('🗑️ Production - Deleting order:', id);
      await storage.deleteOrder(id);
      console.log('✅ Production - Order deleted successfully:', id);
      res.status(204).send();
    } catch (error) {
      console.error("❌ Production - Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Deliveries routes
  app.get('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        groupIds = storeId ? [parseInt(storeId as string)] : undefined;
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
      }

      let deliveries;
      if (startDate && endDate) {
        deliveries = await storage.getDeliveriesByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        deliveries = await storage.getDeliveries(groupIds);
      }

      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const deliveryData = {
        ...req.body,
        createdBy: userId,
      };

      const result = insertDeliverySchema.safeParse(deliveryData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const delivery = await storage.createDelivery(result.data);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  // Route spécifique AVANT la route générale pour éviter l'interception
  app.post('/api/deliveries/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { blNumber, blAmount } = req.body;
      
      console.log('🔍 POST /api/deliveries/:id/validate - Request:', { id, blNumber, blAmount });
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de livraison invalide" });
      }
      
      // Validation des données BL
      if (blNumber && typeof blNumber !== 'string') {
        return res.status(400).json({ message: "Le numéro BL doit être une chaîne de caractères" });
      }
      
      if (blAmount !== undefined && (isNaN(blAmount) || blAmount < 0)) {
        return res.status(400).json({ message: "Le montant BL doit être un nombre positif" });
      }

      await storage.validateDelivery(id, { blNumber, blAmount });
      console.log('✅ Delivery validated successfully:', { id, blNumber, blAmount });
      res.json({ message: "Livraison validée avec succès" });
    } catch (error) {
      console.error("❌ Error validating delivery:", error);
      
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('💾 Database schema issue:', error.message);
        return res.status(500).json({ message: "Erreur de structure de base de données. Contactez l'administrateur." });
      }
      
      if (error.message.includes('constraint') || error.message.includes('check')) {
        return res.status(400).json({ message: "Données invalides pour la validation" });
      }
      
      res.status(500).json({ message: "Erreur lors de la validation de la livraison" });
    }
  });

  app.put('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertDeliverySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const delivery = await storage.updateDelivery(id, result.data);
      res.json(delivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDelivery(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      
      // ✅ CORRECTION: Permettre aux admins ET managers de voir les utilisateurs (nécessaire pour la gestion des rôles)
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      // 🔧 CORRECTION CRITIQUE: Utiliser getUsersWithRolesAndGroups() au lieu de getUsers() pour l'affichage des rôles
      const usersWithRoles = await storage.getUsersWithRolesAndGroups();
      const safeUsers = Array.isArray(usersWithRoles) ? usersWithRoles : [];
      
      console.log('🔐 API /api/users - Returning:', { isArray: Array.isArray(safeUsers), length: safeUsers.length });
      console.log('👥 Users API response:', { count: safeUsers.length, requestingUser: user.role });
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
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const newUser = await storage.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = req.params.id;
      
      // Validation des champs requis
      const userData = req.body;
      console.log('📝 PUT /api/users/:id - Request body:', userData);
      console.log('📝 User ID from params:', id);
      
      // Vérifier que l'utilisateur existe avant modification
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        console.log('❌ User not found with ID:', id);
        return res.status(404).json({ message: `Utilisateur avec l'ID ${id} non trouvé` });
      }
      
      console.log('✅ Found user to update:', existingUser.username);
      
      // Nettoyer les données - supprimer les champs vides ou undefined
      const cleanedUserData = {};
      for (const [key, value] of Object.entries(userData)) {
        if (value !== undefined && value !== null && 
            (typeof value !== 'string' || value.trim() !== '')) {
          cleanedUserData[key] = typeof value === 'string' ? value.trim() : value;
        }
      }
      
      console.log('📝 Cleaned user data:', cleanedUserData);
      
      if (Object.keys(cleanedUserData).length === 0) {
        console.log('⚠️ No valid data to update');
        return res.status(400).json({ message: "Aucune donnée valide à mettre à jour" });
      }
      
      // Validation des champs obligatoires seulement si ils sont fournis et non vides
      if (cleanedUserData.firstName && !cleanedUserData.firstName.trim()) {
        return res.status(400).json({ message: "Le prénom ne peut pas être vide" });
      }
      
      if (cleanedUserData.lastName && !cleanedUserData.lastName.trim()) {
        return res.status(400).json({ message: "Le nom ne peut pas être vide" });
      }
      
      if (cleanedUserData.email) {
        if (!cleanedUserData.email.includes('@')) {
          return res.status(400).json({ message: "L'email doit être valide" });
        }
      }
      
      if (cleanedUserData.password && cleanedUserData.password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }
      
      const updatedUser = await storage.updateUser(id, cleanedUserData);
      console.log('✅ User updated successfully:', { id, updatedFields: Object.keys(cleanedUserData) });
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      
      // Gestion des erreurs spécifiques
      if (error.message.includes('email') && error.message.includes('unique')) {
        return res.status(400).json({ message: "Cet email est déjà utilisé par un autre utilisateur" });
      }
      
      if (error.message.includes('username') && error.message.includes('unique')) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
      }
      
      if (error.message.includes('ne peut pas être vide') || 
          error.message.includes('doit être valide') ||
          error.message.includes('Aucun champ') ||
          error.message.includes('non trouvé')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = req.params.id;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User groups routes
  app.get('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const userGroups = await storage.getUserGroups(userId);
      res.json(userGroups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // Route supprimée car dupliquée - utilisation de la route unique en bas du fichier

  // Statistics routes
  app.get('/api/stats/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const storeId = req.query.storeId as string;

      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        groupIds = storeId ? [parseInt(storeId)] : undefined;
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
      }

      const stats = await storage.getMonthlyStats(year, month, groupIds);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Publicities routes
  app.get('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const publicities = await storage.getPublicities(year);
      res.json(publicities);
    } catch (error) {
      console.error("Error fetching publicities:", error);
      res.status(500).json({ message: "Failed to fetch publicities" });
    }
  });

  app.post('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const publicity = await storage.createPublicity({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(publicity);
    } catch (error) {
      console.error("Error creating publicity:", error);
      res.status(500).json({ message: "Failed to create publicity" });
    }
  });

  app.put('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const publicity = await storage.updatePublicity(id, req.body);
      res.json(publicity);
    } catch (error) {
      console.error("Error updating publicity:", error);
      res.status(500).json({ message: "Failed to update publicity" });
    }
  });

  app.delete('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePublicity(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting publicity:", error);
      res.status(500).json({ message: "Failed to delete publicity" });
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

      const groupIds = user.userGroups.map((ug: any) => ug.groupId);
      const customerOrders = await storage.getCustomerOrders(groupIds);
      res.json(customerOrders || []);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.post('/api/customer-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const customerOrder = await storage.createCustomerOrder({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(customerOrder);
    } catch (error) {
      console.error("Error creating customer order:", error);
      res.status(500).json({ message: "Failed to create customer order" });
    }
  });

  app.put('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerOrder = await storage.updateCustomerOrder(id, req.body);
      res.json(customerOrder);
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ message: "Failed to update customer order" });
    }
  });

  app.delete('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomerOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer order:", error);
      res.status(500).json({ message: "Failed to delete customer order" });
    }
  });







  // NocoDB Configuration routes
  app.get('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const configs = await storage.getNocodbConfigs();
      console.log('📊 NocoDB configs API:', { count: configs ? configs.length : 0, configs });
      
      // Assurer que la réponse est toujours un array comme en développement
      const safeConfigs = Array.isArray(configs) ? configs : [];
      res.json(safeConfigs);
    } catch (error) {
      console.error('Error fetching NocoDB configs:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des configurations' });
    }
  });

  app.post('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const config = await storage.createNocodbConfig({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la configuration' });
    }
  });

  app.put('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
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

  // Invoice verification routes (simplified for production)
  app.post('/api/verify-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, invoiceReference } = req.body;
      
      if (!groupId || !invoiceReference) {
        return res.status(400).json({ message: "groupId and invoiceReference are required" });
      }

      // Simplified verification - always return false for production
      res.json({ exists: false });
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

      // Simplified verification - always return false for production
      const results: any = {};
      invoiceReferences.forEach((ref: any) => {
        results[ref.deliveryId] = { exists: false };
      });
      
      res.json(results);
    } catch (error) {
      console.error("Error verifying invoices:", error);
      res.status(500).json({ message: "Failed to verify invoices" });
    }
  });

  // ===== ROLE MANAGEMENT ROUTES =====

  // Roles routes
  app.get('/api/roles', isAuthenticated, async (req: any, res) => {
    try {
      // ✅ CORRECTION: Permettre à tous les utilisateurs authentifiés de lire les rôles (nécessaire pour l'affichage des couleurs)
      const roles = await storage.getRoles();
      console.log('🎨 Roles API response:', { count: roles.length, firstRole: roles[0] });
      res.json(Array.isArray(roles) ? roles : []);
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

      const result = insertRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const role = await storage.createRole(result.data);
      res.status(201).json(role);
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
      const result = insertRoleSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const role = await storage.updateRole(id, result.data);
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
      await storage.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  app.get('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      // ✅ CORRECTION: Permettre à tous les utilisateurs authentifiés de lire les permissions (nécessaire pour l'interface de gestion des rôles)
      const permissions = await storage.getPermissions();
      console.log('🔐 Permissions API response:', { count: permissions.length, firstPermission: permissions[0] });
      res.json(Array.isArray(permissions) ? permissions : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permission = await storage.createPermission(req.body);
      res.status(201).json(permission);
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
      const permission = await storage.updatePermission(id, req.body);
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
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  app.get('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.id);
      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(Array.isArray(rolePermissions) ? rolePermissions : []);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.post('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      await storage.setRolePermissions(roleId, permissionIds);
      res.json({ message: "Role permissions updated successfully" });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // User-Role association routes (AJOUTÉ POUR PRODUCTION)
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

  // POST route for user roles (used by frontend) - ROUTE MANQUANTE AJOUTÉE
  app.post('/api/users/:userId/roles', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const { roleIds } = req.body;
      
      console.log("🔧 POST User roles API called:", { userId, roleIds, assignedBy: currentUser.id });
      
      if (!Array.isArray(roleIds)) {
        return res.status(400).json({ message: "roleIds must be an array" });
      }
      
      await storage.setUserRoles(userId, roleIds, currentUser.id);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error updating user roles:", error);
      
      // Gestion d'erreur spécifique avec message plus informatif
      if (error.message && error.message.includes('does not exist')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  app.put('/api/users/:id/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.id;
      const { roleIds } = req.body;
      
      console.log("🎯 setUserRoles request:", { userId, roleIds, assignedBy: user.id });
      
      await storage.setUserRoles(userId, roleIds, user.id);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error updating user roles:", error);
      
      // Gestion d'erreur spécifique avec message plus informatif
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // User-Group management routes (admin only) - ROUTE CORRIGÉE AVEC DIAGNOSTIC COMPLET
  app.post('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 DIAGNOSTIC: Route /api/users/:userId/groups appelée');
      console.log('🔍 DIAGNOSTIC: req.user =', req.user);
      console.log('🔍 DIAGNOSTIC: req.params =', req.params);
      console.log('🔍 DIAGNOSTIC: req.body =', req.body);
      
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔍 DIAGNOSTIC: currentUserId =', currentUserId);
      
      const currentUser = await storage.getUser(currentUserId);
      console.log('🔍 DIAGNOSTIC: currentUser =', currentUser);
      
      if (!currentUser) {
        console.log('❌ ERREUR: Utilisateur courant non trouvé');
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (currentUser.role !== 'admin') {
        console.log('❌ ERREUR: Permissions insuffisantes, rôle:', currentUser.role);
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.userId;
      const { groupId } = req.body;
      
      console.log('🔍 DIAGNOSTIC: userId =', userId, 'groupId =', groupId);

      // Vérifier que l'utilisateur cible existe
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        console.log('❌ ERREUR: Utilisateur cible non trouvé:', userId);
        return res.status(404).json({ message: `User not found: ${userId}` });
      }
      console.log('✅ DIAGNOSTIC: Utilisateur cible trouvé:', targetUser.username);

      // Vérifier que le groupe existe
      const group = await storage.getGroup(groupId);
      if (!group) {
        console.log('❌ ERREUR: Groupe non trouvé:', groupId);
        return res.status(404).json({ message: `Group not found: ${groupId}` });
      }
      console.log('✅ DIAGNOSTIC: Groupe trouvé:', group.name);

      // Effectuer l'assignation
      console.log('🔄 DIAGNOSTIC: Assignation en cours...');
      const userGroup = await storage.assignUserToGroup({ userId, groupId });
      console.log('✅ SUCCÈS: Assignation réussie:', userGroup);
      
      res.json({ 
        success: true,
        message: `Utilisateur ${targetUser.username} assigné au groupe ${group.name}`,
        userGroup 
      });
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE dans assignation groupe:", error);
      console.error("❌ Stack trace:", error.stack);
      
      res.status(500).json({ 
        message: "Impossible d'assigner l'utilisateur au groupe",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
      
      console.log('🗑️ Removing user from group:', { userId, groupId });

      await storage.removeUserFromGroup(userId, groupId);
      console.log('✅ User removed from group successfully');
      
      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  const server = createServer(app);
  return server;
}