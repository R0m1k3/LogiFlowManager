import { storage } from "./storage.production";

// Définition des permissions par défaut du système
const defaultPermissions = [
  // Dashboard permissions
  { name: "dashboard_read", description: "Accès en lecture au tableau de bord", category: "Dashboard" },
  
  // Calendar permissions
  { name: "calendar_read", description: "Accès en lecture au calendrier", category: "Calendar" },
  { name: "calendar_create", description: "Créer des événements depuis le calendrier", category: "Calendar" },
  { name: "calendar_update", description: "Modifier des événements depuis le calendrier", category: "Calendar" },
  { name: "calendar_delete", description: "Supprimer des événements depuis le calendrier", category: "Calendar" },
  
  // Orders permissions
  { name: "orders_read", description: "Accès en lecture aux commandes", category: "Orders" },
  { name: "orders_create", description: "Créer de nouvelles commandes", category: "Orders" },
  { name: "orders_update", description: "Modifier les commandes existantes", category: "Orders" },
  { name: "orders_delete", description: "Supprimer des commandes", category: "Orders" },
  
  // Deliveries permissions
  { name: "deliveries_read", description: "Accès en lecture aux livraisons", category: "Deliveries" },
  { name: "deliveries_create", description: "Créer de nouvelles livraisons", category: "Deliveries" },
  { name: "deliveries_update", description: "Modifier les livraisons existantes", category: "Deliveries" },
  { name: "deliveries_validate", description: "Valider les livraisons et saisir les BL", category: "Deliveries" },
  { name: "deliveries_delete", description: "Supprimer des livraisons", category: "Deliveries" },
  
  // BL Reconciliation permissions
  { name: "reconciliation_read", description: "Accès en lecture au rapprochement BL/Factures", category: "Reconciliation" },
  { name: "reconciliation_create", description: "Créer des rapprochements", category: "Reconciliation" },
  { name: "reconciliation_update", description: "Modifier les données de rapprochement", category: "Reconciliation" },
  { name: "reconciliation_delete", description: "Supprimer des rapprochements", category: "Reconciliation" },
  
  // Users permissions
  { name: "users_read", description: "Accès en lecture aux utilisateurs", category: "Users" },
  { name: "users_create", description: "Créer de nouveaux utilisateurs", category: "Users" },
  { name: "users_update", description: "Modifier les utilisateurs existants", category: "Users" },
  { name: "users_delete", description: "Supprimer des utilisateurs", category: "Users" },
  
  // Groups permissions
  { name: "magasins_read", description: "Accès en lecture aux magasins", category: "Magasins" },
  { name: "magasins_create", description: "Créer de nouveaux magasins", category: "Magasins" },
  { name: "magasins_update", description: "Modifier les magasins existants", category: "Magasins" },
  { name: "magasins_delete", description: "Supprimer des magasins", category: "Magasins" },
  
  // Suppliers permissions
  { name: "suppliers_read", description: "Accès en lecture aux fournisseurs", category: "Suppliers" },
  { name: "suppliers_create", description: "Créer de nouveaux fournisseurs", category: "Suppliers" },
  { name: "suppliers_update", description: "Modifier les fournisseurs existants", category: "Suppliers" },
  { name: "suppliers_delete", description: "Supprimer des fournisseurs", category: "Suppliers" },
  
  // Publicities permissions
  { name: "publicities_read", description: "Accès en lecture aux publicités", category: "Publicities" },
  { name: "publicities_create", description: "Créer de nouvelles publicités", category: "Publicities" },
  { name: "publicities_update", description: "Modifier les publicités existantes", category: "Publicities" },
  { name: "publicities_delete", description: "Supprimer des publicités", category: "Publicities" },
];

// Définition des rôles par défaut
const defaultRoles = [
  {
    name: "admin",
    description: "Accès complet à toutes les fonctionnalités du système",
    isSystem: true,
    permissions: defaultPermissions.map(p => p.name) // Toutes les permissions
  },
  {
    name: "manager",
    description: "Accès à la gestion des commandes, livraisons et fournisseurs",
    isSystem: true,
    permissions: [
      "dashboard_read",
      "calendar_read", "calendar_create", "calendar_update", "calendar_delete",
      "orders_read", "orders_create", "orders_update", "orders_delete",
      "deliveries_read", "deliveries_create", "deliveries_update", "deliveries_delete", "deliveries_validate",
      "reconciliation_read", "reconciliation_create", "reconciliation_update", "reconciliation_delete",
      "magasins_read", "magasins_create", "magasins_update", "magasins_delete",
      "suppliers_read", "suppliers_create", "suppliers_update", "suppliers_delete",
      "publicities_read", "publicities_create", "publicities_update", "publicities_delete"
    ]
  },
  {
    name: "employee",
    description: "Accès en lecture aux données et création limitée",
    isSystem: true,
    permissions: [
      "dashboard_read",
      "calendar_read", "calendar_create",
      "orders_read", "orders_create",
      "deliveries_read", "deliveries_create",
      "reconciliation_read",
      "magasins_read",
      "suppliers_read",
      "publicities_read"
    ]
  }
];

export async function initializeRolesAndPermissions() {
  try {
    console.log("🔧 Initializing roles and permissions for production...");

    // Créer les permissions
    const existingPermissions = await storage.getPermissions();
    const existingPermissionNames = existingPermissions.map(p => p.name);

    for (const permissionData of defaultPermissions) {
      if (!existingPermissionNames.includes(permissionData.name)) {
        await storage.createPermission(permissionData);
        console.log(`✅ Created permission: ${permissionData.name}`);
      }
    }

    // Récupérer toutes les permissions pour mapper les IDs
    const allPermissions = await storage.getPermissions();
    const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));

    // Créer les rôles
    const existingRoles = await storage.getRoles();
    const existingRoleNames = existingRoles.map(r => r.name);

    for (const roleData of defaultRoles) {
      if (!existingRoleNames.includes(roleData.name)) {
        // Créer le rôle
        const newRole = await storage.createRole({
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem
        });

        // Assigner les permissions
        const permissionIds = roleData.permissions
          .map(permName => permissionMap.get(permName))
          .filter(id => id !== undefined) as number[];
          
        await storage.setRolePermissions(newRole.id, permissionIds);
        console.log(`✅ Created role: ${roleData.name} with ${permissionIds.length} permissions`);
      }
    }

    console.log("✅ Roles and permissions initialization completed for production");
  } catch (error) {
    console.error("❌ Error initializing roles and permissions:", error);
    throw error;
  }
}