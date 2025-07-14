import { Express } from "express";
import { createServer } from "http";
import { db, pool } from "./db.production";
import { storage } from "./storage";
import { requireAuth } from "./localAuth";
import { 
  users, 
  groups, 
  suppliers, 
  orders, 
  deliveries, 
  userGroups, 
  publicities, 
  publicityParticipations, 
  customerOrders, 
  roles, 
  permissions, 
  rolePermissions,
  nocodbConfig
} from "@shared/schema";
import { insertGroupSchema, insertSupplierSchema, insertOrderSchema, insertDeliverySchema, insertUserGroupSchema, insertPublicitySchema, insertCustomerOrderSchema, insertRoleSchema, insertPermissionSchema, insertRolePermissionSchema, insertNocodbConfigSchema } from "@shared/schema";
import { eq, and, sql, desc, asc, gte, lte, like, or, inArray } from "drizzle-orm";
import { hashPassword } from "./localAuth";
import { verifyInvoiceReference } from "./nocodbService";

export async function registerRoutes(app: Express): Promise<any> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: 'production' 
    });
  });

  // Auth routes
  app.post('/api/login', (req, res, next) => {
    // This is handled by passport middleware in localAuth.ts
    next();
  });

  app.get('/api/user', requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Users routes
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users', requireAuth, async (req, res) => {
    try {
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
        userData.passwordChanged = true;
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
        userData.passwordChanged = true;
      }
      
      const user = await storage.updateUser(userId, userData);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User groups routes
  app.get('/api/users/:userId/groups', requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const userGroups = await storage.getUserGroups(userId);
      res.json(userGroups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users/:userId/groups', requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { groupIds } = req.body;
      
      // Remove existing groups
      await pool.query('DELETE FROM user_groups WHERE user_id = $1', [userId]);
      
      // Add new groups
      for (const groupId of groupIds) {
        await storage.assignUserToGroup({ userId, groupId });
      }
      
      res.json({ message: 'User groups updated successfully' });
    } catch (error) {
      console.error('Error updating user groups:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Groups routes
  app.get('/api/groups', requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/groups', requireAuth, async (req, res) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.json(group);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/groups/:id', requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const groupData = req.body;
      const group = await storage.updateGroup(groupId, groupData);
      res.json(group);
    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/groups/:id', requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      await storage.deleteGroup(groupId);
      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Suppliers routes
  app.get('/api/suppliers', requireAuth, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/suppliers', requireAuth, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.json(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/suppliers/:id', requireAuth, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const supplierData = req.body;
      const supplier = await storage.updateSupplier(supplierId, supplierData);
      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/suppliers/:id', requireAuth, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      await storage.deleteSupplier(supplierId);
      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Orders routes
  app.get('/api/orders', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, groupIds } = req.query;
      
      let orders;
      if (startDate && endDate) {
        orders = await storage.getOrdersByDateRange(
          startDate as string,
          endDate as string,
          groupIds ? JSON.parse(groupIds as string) : undefined
        );
      } else {
        orders = await storage.getOrders(
          groupIds ? JSON.parse(groupIds as string) : undefined
        );
      }
      
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderData = req.body;
      const order = await storage.updateOrder(orderId, orderData);
      res.json(order);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      await storage.deleteOrder(orderId);
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Deliveries routes
  app.get('/api/deliveries', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, groupIds } = req.query;
      
      let deliveries;
      if (startDate && endDate) {
        deliveries = await storage.getDeliveriesByDateRange(
          startDate as string,
          endDate as string,
          groupIds ? JSON.parse(groupIds as string) : undefined
        );
      } else {
        deliveries = await storage.getDeliveries(
          groupIds ? JSON.parse(groupIds as string) : undefined
        );
      }
      
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/deliveries/:id', requireAuth, async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const delivery = await storage.getDelivery(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error('Error fetching delivery:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deliveries', requireAuth, async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.json(delivery);
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/deliveries/:id', requireAuth, async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const deliveryData = req.body;
      const delivery = await storage.updateDelivery(deliveryId, deliveryData);
      res.json(delivery);
    } catch (error) {
      console.error('Error updating delivery:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/deliveries/:id', requireAuth, async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      await storage.deleteDelivery(deliveryId);
      res.json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deliveries/:id/validate', requireAuth, async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const { blNumber, blAmount } = req.body;
      
      await storage.validateDelivery(deliveryId, { blNumber, blAmount });
      res.json({ message: 'Delivery validated successfully' });
    } catch (error) {
      console.error('Error validating delivery:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Statistics routes
  app.get('/api/stats/monthly', requireAuth, async (req, res) => {
    try {
      const { year, month, groupIds } = req.query;
      
      const stats = await storage.getMonthlyStats(
        parseInt(year as string),
        parseInt(month as string),
        groupIds ? JSON.parse(groupIds as string) : undefined
      );
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Publicities routes
  app.get('/api/publicities', requireAuth, async (req, res) => {
    try {
      const { year, groupIds } = req.query;
      
      const publicities = await storage.getPublicities(
        year ? parseInt(year as string) : undefined,
        groupIds ? JSON.parse(groupIds as string) : undefined
      );
      
      res.json(publicities);
    } catch (error) {
      console.error('Error fetching publicities:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/publicities', requireAuth, async (req, res) => {
    try {
      const publicityData = insertPublicitySchema.parse(req.body);
      const publicity = await storage.createPublicity(publicityData);
      res.json(publicity);
    } catch (error) {
      console.error('Error creating publicity:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/publicities/:id', requireAuth, async (req, res) => {
    try {
      const publicityId = parseInt(req.params.id);
      const publicityData = req.body;
      const publicity = await storage.updatePublicity(publicityId, publicityData);
      res.json(publicity);
    } catch (error) {
      console.error('Error updating publicity:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/publicities/:id', requireAuth, async (req, res) => {
    try {
      const publicityId = parseInt(req.params.id);
      await storage.deletePublicity(publicityId);
      res.json({ message: 'Publicity deleted successfully' });
    } catch (error) {
      console.error('Error deleting publicity:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Publicity participations routes
  app.get('/api/publicities/:id/participations', requireAuth, async (req, res) => {
    try {
      const publicityId = parseInt(req.params.id);
      const participations = await storage.getPublicityParticipations(publicityId);
      res.json(participations);
    } catch (error) {
      console.error('Error fetching participations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/publicities/:id/participations', requireAuth, async (req, res) => {
    try {
      const publicityId = parseInt(req.params.id);
      const { groupIds } = req.body;
      
      await storage.setPublicityParticipations(publicityId, groupIds);
      res.json({ message: 'Participations updated successfully' });
    } catch (error) {
      console.error('Error updating participations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Customer orders routes
  app.get('/api/customer-orders', requireAuth, async (req, res) => {
    try {
      const { groupIds } = req.query;
      
      const customerOrders = await storage.getCustomerOrders(
        groupIds ? JSON.parse(groupIds as string) : undefined
      );
      
      res.json(customerOrders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/customer-orders/:id', requireAuth, async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.id);
      const customerOrder = await storage.getCustomerOrder(customerOrderId);
      
      if (!customerOrder) {
        return res.status(404).json({ message: 'Customer order not found' });
      }
      
      res.json(customerOrder);
    } catch (error) {
      console.error('Error fetching customer order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/customer-orders', requireAuth, async (req, res) => {
    try {
      const customerOrderData = insertCustomerOrderSchema.parse(req.body);
      const customerOrder = await storage.createCustomerOrder(customerOrderData);
      res.json(customerOrder);
    } catch (error) {
      console.error('Error creating customer order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/customer-orders/:id', requireAuth, async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.id);
      const customerOrderData = req.body;
      const customerOrder = await storage.updateCustomerOrder(customerOrderId, customerOrderData);
      res.json(customerOrder);
    } catch (error) {
      console.error('Error updating customer order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/customer-orders/:id', requireAuth, async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.id);
      await storage.deleteCustomerOrder(customerOrderId);
      res.json({ message: 'Customer order deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Roles routes
  app.get('/api/roles', requireAuth, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/roles', requireAuth, async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.json(role);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/roles/:id', requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const roleData = req.body;
      const role = await storage.updateRole(roleId, roleData);
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/roles/:id', requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      await storage.deleteRole(roleId);
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Permissions routes
  app.get('/api/permissions', requireAuth, async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Role permissions routes
  app.get('/api/roles/:id/permissions', requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/roles/:id/permissions', requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      await storage.setRolePermissions(roleId, permissionIds);
      res.json({ message: 'Role permissions updated successfully' });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // NocoDB configuration routes
  app.get('/api/nocodb-config', requireAuth, async (req, res) => {
    try {
      const configs = await storage.getNocodbConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching NocoDB configs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/nocodb-config', requireAuth, async (req, res) => {
    try {
      const configData = insertNocodbConfigSchema.parse(req.body);
      const config = await storage.createNocodbConfig(configData);
      res.json(config);
    } catch (error) {
      console.error('Error creating NocoDB config:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/nocodb-config/:id', requireAuth, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const configData = req.body;
      const config = await storage.updateNocodbConfig(configId, configData);
      res.json(config);
    } catch (error) {
      console.error('Error updating NocoDB config:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/nocodb-config/:id', requireAuth, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      await storage.deleteNocodbConfig(configId);
      res.json({ message: 'NocoDB config deleted successfully' });
    } catch (error) {
      console.error('Error deleting NocoDB config:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Invoice verification route
  app.post('/api/verify-invoice', requireAuth, async (req, res) => {
    try {
      const { invoiceReference, groupId } = req.body;
      
      const result = await verifyInvoiceReference(invoiceReference, groupId);
      res.json(result);
    } catch (error) {
      console.error('Error verifying invoice:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return createServer(app);
}