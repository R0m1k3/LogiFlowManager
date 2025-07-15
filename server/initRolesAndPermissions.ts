import { storage } from "./storage";

export async function initRolesAndPermissions() {
  console.log("Initializing roles and permissions...");

  try {
    // Check if roles already exist
    const existingRoles = await storage.getRoles();
    if (existingRoles.length > 0) {
      console.log("Roles already exist, skipping initialization");
      return;
    }

    // Create default roles
    const adminRole = await storage.createRole({
      name: "admin",
      displayName: "Administrateur",
      description: "Accès complet à toutes les fonctionnalités du système",
      color: "#dc2626",
      isSystem: true,
      isActive: true,
    });

    const managerRole = await storage.createRole({
      name: "manager",
      displayName: "Manager",
      description: "Accès à la gestion des commandes, livraisons et fournisseurs",
      color: "#2563eb",
      isSystem: true,
      isActive: true,
    });

    const employeeRole = await storage.createRole({
      name: "employee",
      displayName: "Employé",
      description: "Accès en lecture aux données et publicités",
      color: "#16a34a",
      isSystem: true,
      isActive: true,
    });

    const directeurRole = await storage.createRole({
      name: "directeur",
      displayName: "Directeur",
      description: "Supervision générale et gestion stratégique",
      color: "#7c3aed",
      isSystem: true,
      isActive: true,
    });

    console.log("Created default roles:", { adminRole, managerRole, employeeRole, directeurRole });

    // Create default permissions
    const permissions = [
      // Dashboard permissions
      { category: "dashboard", name: "dashboard_read", displayName: "Voir tableau de bord", description: "Accès en lecture au tableau de bord", action: "read", resource: "dashboard", isSystem: true },
      
      // Groups/Stores permissions
      { category: "groups", name: "groups_read", displayName: "Voir magasins", description: "Accès en lecture aux magasins", action: "read", resource: "groups", isSystem: true },
      { category: "groups", name: "groups_create", displayName: "Créer magasins", description: "Création de nouveaux magasins", action: "create", resource: "groups", isSystem: true },
      { category: "groups", name: "groups_update", displayName: "Modifier magasins", description: "Modification des magasins existants", action: "update", resource: "groups", isSystem: true },
      { category: "groups", name: "groups_delete", displayName: "Supprimer magasins", description: "Suppression de magasins", action: "delete", resource: "groups", isSystem: true },
      
      // Suppliers permissions
      { category: "suppliers", name: "suppliers_read", displayName: "Voir fournisseurs", description: "Accès en lecture aux fournisseurs", action: "read", resource: "suppliers", isSystem: true },
      { category: "suppliers", name: "suppliers_create", displayName: "Créer fournisseurs", description: "Création de nouveaux fournisseurs", action: "create", resource: "suppliers", isSystem: true },
      { category: "suppliers", name: "suppliers_update", displayName: "Modifier fournisseurs", description: "Modification des fournisseurs existants", action: "update", resource: "suppliers", isSystem: true },
      { category: "suppliers", name: "suppliers_delete", displayName: "Supprimer fournisseurs", description: "Suppression de fournisseurs", action: "delete", resource: "suppliers", isSystem: true },
      
      // Orders permissions
      { category: "orders", name: "orders_read", displayName: "Voir commandes", description: "Accès en lecture aux commandes", action: "read", resource: "orders", isSystem: true },
      { category: "orders", name: "orders_create", displayName: "Créer commandes", description: "Création de nouvelles commandes", action: "create", resource: "orders", isSystem: true },
      { category: "orders", name: "orders_update", displayName: "Modifier commandes", description: "Modification des commandes existantes", action: "update", resource: "orders", isSystem: true },
      { category: "orders", name: "orders_delete", displayName: "Supprimer commandes", description: "Suppression de commandes", action: "delete", resource: "orders", isSystem: true },
      
      // Deliveries permissions
      { category: "deliveries", name: "deliveries_read", displayName: "Voir livraisons", description: "Accès en lecture aux livraisons", action: "read", resource: "deliveries", isSystem: true },
      { category: "deliveries", name: "deliveries_create", displayName: "Créer livraisons", description: "Création de nouvelles livraisons", action: "create", resource: "deliveries", isSystem: true },
      { category: "deliveries", name: "deliveries_update", displayName: "Modifier livraisons", description: "Modification des livraisons existantes", action: "update", resource: "deliveries", isSystem: true },
      { category: "deliveries", name: "deliveries_delete", displayName: "Supprimer livraisons", description: "Suppression de livraisons", action: "delete", resource: "deliveries", isSystem: true },
      { category: "deliveries", name: "deliveries_validate", displayName: "Valider livraisons", description: "Validation des livraisons avec BL", action: "validate", resource: "deliveries", isSystem: true },
      
      // Calendar permissions
      { category: "calendar", name: "calendar_read", displayName: "Voir calendrier", description: "Accès en lecture au calendrier", action: "read", resource: "calendar", isSystem: true },
      
      // BL Reconciliation permissions
      { category: "reconciliation", name: "reconciliation_read", displayName: "Voir rapprochement", description: "Accès en lecture au rapprochement BL/Factures", action: "read", resource: "reconciliation", isSystem: true },
      { category: "reconciliation", name: "reconciliation_update", displayName: "Modifier rapprochement", description: "Modification des données de rapprochement", action: "update", resource: "reconciliation", isSystem: true },
      
      // Publicities permissions
      { category: "publicities", name: "publicities_read", displayName: "Voir publicités", description: "Accès en lecture aux publicités", action: "read", resource: "publicities", isSystem: true },
      { category: "publicities", name: "publicities_create", displayName: "Créer publicités", description: "Création de nouvelles publicités", action: "create", resource: "publicities", isSystem: true },
      { category: "publicities", name: "publicities_update", displayName: "Modifier publicités", description: "Modification des publicités existantes", action: "update", resource: "publicities", isSystem: true },
      { category: "publicities", name: "publicities_delete", displayName: "Supprimer publicités", description: "Suppression de publicités", action: "delete", resource: "publicities", isSystem: true },
      
      // Customer Orders permissions
      { category: "customer_orders", name: "customer_orders_read", displayName: "Voir commandes clients", description: "Accès en lecture aux commandes clients", action: "read", resource: "customer_orders", isSystem: true },
      { category: "customer_orders", name: "customer_orders_create", displayName: "Créer commandes clients", description: "Création de nouvelles commandes clients", action: "create", resource: "customer_orders", isSystem: true },
      { category: "customer_orders", name: "customer_orders_update", displayName: "Modifier commandes clients", description: "Modification des commandes clients existantes", action: "update", resource: "customer_orders", isSystem: true },
      { category: "customer_orders", name: "customer_orders_delete", displayName: "Supprimer commandes clients", description: "Suppression de commandes clients", action: "delete", resource: "customer_orders", isSystem: true },
      { category: "customer_orders", name: "customer_orders_print", displayName: "Imprimer étiquettes", description: "Impression d'étiquettes de commandes clients", action: "print", resource: "customer_orders", isSystem: true },
      { category: "customer_orders", name: "customer_orders_notify", displayName: "Notifier clients", description: "Envoi de notifications aux clients", action: "notify", resource: "customer_orders", isSystem: true },
      
      // Users permissions
      { category: "users", name: "users_read", displayName: "Voir utilisateurs", description: "Accès en lecture aux utilisateurs", action: "read", resource: "users", isSystem: true },
      { category: "users", name: "users_create", displayName: "Créer utilisateurs", description: "Création de nouveaux utilisateurs", action: "create", resource: "users", isSystem: true },
      { category: "users", name: "users_update", displayName: "Modifier utilisateurs", description: "Modification des utilisateurs existants", action: "update", resource: "users", isSystem: true },
      { category: "users", name: "users_delete", displayName: "Supprimer utilisateurs", description: "Suppression d'utilisateurs", action: "delete", resource: "users", isSystem: true },
      
      // Role Management permissions
      { category: "roles", name: "roles_read", displayName: "Voir rôles", description: "Accès en lecture aux rôles", action: "read", resource: "roles", isSystem: true },
      { category: "roles", name: "roles_create", displayName: "Créer rôles", description: "Création de nouveaux rôles", action: "create", resource: "roles", isSystem: true },
      { category: "roles", name: "roles_update", displayName: "Modifier rôles", description: "Modification des rôles existants", action: "update", resource: "roles", isSystem: true },
      { category: "roles", name: "roles_delete", displayName: "Supprimer rôles", description: "Suppression de rôles", action: "delete", resource: "roles", isSystem: true },
      { category: "roles", name: "roles_assign", displayName: "Assigner rôles", description: "Attribution de rôles aux utilisateurs", action: "assign", resource: "roles", isSystem: true },
      
      // System administration permissions
      { category: "system", name: "system_admin", displayName: "Administration système", description: "Accès complet à l'administration du système", action: "admin", resource: "system", isSystem: true },
      { category: "system", name: "nocodb_config", displayName: "Configuration NocoDB", description: "Gestion de la configuration NocoDB", action: "config", resource: "nocodb", isSystem: true },
    ];

    // Create all permissions
    const createdPermissions = [];
    for (const permData of permissions) {
      const permission = await storage.createPermission(permData);
      createdPermissions.push(permission);
    }

    console.log(`Created ${createdPermissions.length} permissions`);

    // Assign permissions to roles
    
    // Super Admin gets all permissions
    const allPermissionIds = createdPermissions.map(p => p.id);
    await storage.setRolePermissions(adminRole.id, allPermissionIds);
    console.log(`Assigned all permissions to Super Admin role`);

    // Manager gets most permissions except system admin and role management
    const managerPermissions = createdPermissions.filter(p => 
      !p.name.startsWith('roles_') && 
      !p.name.startsWith('system_') &&
      p.name !== 'users_delete'
    ).map(p => p.id);
    await storage.setRolePermissions(managerRole.id, managerPermissions);
    console.log(`Assigned ${managerPermissions.length} permissions to Manager role`);

    // Employee gets basic read permissions and customer orders
    const employeePermissions = createdPermissions.filter(p => 
      p.action === 'read' || 
      p.name.startsWith('customer_orders_') ||
      (p.category === 'deliveries' && (p.action === 'create' || p.action === 'update'))
    ).map(p => p.id);
    await storage.setRolePermissions(employeeRole.id, employeePermissions);
    console.log(`Assigned ${employeePermissions.length} permissions to Employee role`);

    console.log("✅ Roles and permissions initialization completed successfully");

  } catch (error) {
    console.error("❌ Error initializing roles and permissions:", error);
    throw error;
  }
}