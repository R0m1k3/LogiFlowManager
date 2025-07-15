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
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const result = insertGroupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const group = await storage.createGroup(result.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
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
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const supplier = await storage.createSupplier(result.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
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

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        groupIds = storeId ? [parseInt(storeId as string)] : undefined;
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
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
      await storage.deleteOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
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
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
      
      // Validation des champs obligatoires si ils sont fournis
      if (userData.firstName !== undefined && (!userData.firstName || !userData.firstName.trim())) {
        return res.status(400).json({ message: "Le prénom ne peut pas être vide" });
      }
      
      if (userData.lastName !== undefined && (!userData.lastName || !userData.lastName.trim())) {
        return res.status(400).json({ message: "Le nom ne peut pas être vide" });
      }
      
      if (userData.email !== undefined) {
        if (!userData.email || !userData.email.trim()) {
          return res.status(400).json({ message: "L'email ne peut pas être vide" });
        }
        if (!userData.email.includes('@')) {
          return res.status(400).json({ message: "L'email doit être valide" });
        }
      }
      
      if (userData.password !== undefined && userData.password && userData.password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      console.log('✅ User updated successfully:', { id, updatedFields: Object.keys(userData) });
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

  app.post('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userId = req.params.userId;
      const { groupIds } = req.body;

      // Clear existing groups
      const existingGroups = await storage.getUserGroups(userId);
      for (const ug of existingGroups) {
        await storage.removeUserFromGroup(userId, ug.groupId);
      }

      // Add new groups
      for (const groupId of groupIds) {
        await storage.assignUserToGroup({ userId, groupId });
      }

      res.json({ message: "User groups updated successfully" });
    } catch (error) {
      console.error("Error updating user groups:", error);
      res.status(500).json({ message: "Failed to update user groups" });
    }
  });

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
      res.json(configs);
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
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roles = await storage.getRoles();
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
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permissions = await storage.getPermissions();
      res.json(Array.isArray(permissions) ? permissions : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.put('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/users/:id/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.id;
      const { roleIds } = req.body;
      
      await storage.setUserRoles(userId, roleIds, user.id);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error updating user roles:", error);
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  const server = createServer(app);
  return server;
}