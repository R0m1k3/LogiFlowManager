import { storage } from "./storage";

// Définition des permissions par défaut du système
const defaultPermissions = [
  // Dashboard permissions
  { name: "dashboard_read", displayName: "Voir le tableau de bord", description: "Accès en lecture au tableau de bord", category: "dashboard", action: "read", resource: "dashboard" },
  
  // Orders permissions
  { name: "orders_read", displayName: "Voir les commandes", description: "Accès en lecture aux commandes", category: "orders", action: "read", resource: "orders" },
  { name: "orders_create", displayName: "Créer des commandes", description: "Créer de nouvelles commandes", category: "orders", action: "create", resource: "orders" },
  { name: "orders_update", displayName: "Modifier les commandes", description: "Modifier les commandes existantes", category: "orders", action: "update", resource: "orders" },
  { name: "orders_delete", displayName: "Supprimer les commandes", description: "Supprimer des commandes", category: "orders", action: "delete", resource: "orders" },
  
  // Deliveries permissions
  { name: "deliveries_read", displayName: "Voir les livraisons", description: "Accès en lecture aux livraisons", category: "deliveries", action: "read", resource: "deliveries" },
  { name: "deliveries_create", displayName: "Créer des livraisons", description: "Créer de nouvelles livraisons", category: "deliveries", action: "create", resource: "deliveries" },
  { name: "deliveries_update", displayName: "Modifier les livraisons", description: "Modifier les livraisons existantes", category: "deliveries", action: "update", resource: "deliveries" },
  { name: "deliveries_delete", displayName: "Supprimer les livraisons", description: "Supprimer des livraisons", category: "deliveries", action: "delete", resource: "deliveries" },
  { name: "deliveries_validate", displayName: "Valider les livraisons", description: "Valider les livraisons et saisir les BL", category: "deliveries", action: "validate", resource: "deliveries" },
  
  // BL Reconciliation permissions
  { name: "reconciliation_read", displayName: "Voir le rapprochement", description: "Accès en lecture au rapprochement BL/Factures", category: "reconciliation", action: "read", resource: "reconciliation" },
  { name: "reconciliation_update", displayName: "Modifier le rapprochement", description: "Modifier les données de rapprochement", category: "reconciliation", action: "update", resource: "reconciliation" },
  
  // Users permissions
  { name: "users_read", displayName: "Voir les utilisateurs", description: "Accès en lecture aux utilisateurs", category: "users", action: "read", resource: "users" },
  { name: "users_create", displayName: "Créer des utilisateurs", description: "Créer de nouveaux utilisateurs", category: "users", action: "create", resource: "users" },
  { name: "users_update", displayName: "Modifier les utilisateurs", description: "Modifier les utilisateurs existants", category: "users", action: "update", resource: "users" },
  { name: "users_delete", displayName: "Supprimer les utilisateurs", description: "Supprimer des utilisateurs", category: "users", action: "delete", resource: "users" },
  
  // Groups permissions
  { name: "groups_read", displayName: "Voir les groupes", description: "Accès en lecture aux groupes/magasins", category: "groups", action: "read", resource: "groups" },
  { name: "groups_create", displayName: "Créer des groupes", description: "Créer de nouveaux groupes/magasins", category: "groups", action: "create", resource: "groups" },
  { name: "groups_update", displayName: "Modifier les groupes", description: "Modifier les groupes/magasins existants", category: "groups", action: "update", resource: "groups" },
  { name: "groups_delete", displayName: "Supprimer les groupes", description: "Supprimer des groupes/magasins", category: "groups", action: "delete", resource: "groups" },
  
  // Suppliers permissions
  { name: "suppliers_read", displayName: "Voir les fournisseurs", description: "Accès en lecture aux fournisseurs", category: "suppliers", action: "read", resource: "suppliers" },
  { name: "suppliers_create", displayName: "Créer des fournisseurs", description: "Créer de nouveaux fournisseurs", category: "suppliers", action: "create", resource: "suppliers" },
  { name: "suppliers_update", displayName: "Modifier les fournisseurs", description: "Modifier les fournisseurs existants", category: "suppliers", action: "update", resource: "suppliers" },
  { name: "suppliers_delete", displayName: "Supprimer les fournisseurs", description: "Supprimer des fournisseurs", category: "suppliers", action: "delete", resource: "suppliers" },
  
  // Publicities permissions
  { name: "publicities_read", displayName: "Voir les publicités", description: "Accès en lecture aux publicités", category: "publicities", action: "read", resource: "publicities" },
  { name: "publicities_create", displayName: "Créer des publicités", description: "Créer de nouvelles publicités", category: "publicities", action: "create", resource: "publicities" },
  { name: "publicities_update", displayName: "Modifier les publicités", description: "Modifier les publicités existantes", category: "publicities", action: "update", resource: "publicities" },
  { name: "publicities_delete", displayName: "Supprimer les publicités", description: "Supprimer des publicités", category: "publicities", action: "delete", resource: "publicities" },
  
  // Roles permissions
  { name: "roles_read", displayName: "Voir les rôles", description: "Accès en lecture aux rôles", category: "roles", action: "read", resource: "roles" },
  { name: "roles_create", displayName: "Créer des rôles", description: "Créer de nouveaux rôles", category: "roles", action: "create", resource: "roles" },
  { name: "roles_update", displayName: "Modifier les rôles", description: "Modifier les rôles existants", category: "roles", action: "update", resource: "roles" },
  { name: "roles_delete", displayName: "Supprimer les rôles", description: "Supprimer des rôles", category: "roles", action: "delete", resource: "roles" },
];

// Définition des rôles par défaut
const defaultRoles = [
  {
    name: "admin",
    displayName: "Administrateur",
    description: "Accès complet à toutes les fonctionnalités du système",
    color: "#dc2626",
    isSystem: true,
    isActive: true,
    permissions: defaultPermissions.map(p => p.name) // Toutes les permissions
  },
  {
    name: "manager",
    displayName: "Gestionnaire",
    description: "Accès à la gestion des commandes, livraisons et fournisseurs",
    color: "#2563eb",
    isSystem: true,
    isActive: true,
    permissions: [
      "dashboard_read",
      "orders_read", "orders_create", "orders_update", "orders_delete",
      "deliveries_read", "deliveries_create", "deliveries_update", "deliveries_delete", "deliveries_validate",
      "reconciliation_read", "reconciliation_update",
      "groups_read", "groups_create", "groups_update", "groups_delete",
      "suppliers_read", "suppliers_create", "suppliers_update", "suppliers_delete",
      "publicities_read", "publicities_create", "publicities_update", "publicities_delete"
    ]
  },
  {
    name: "employee",
    displayName: "Employé",
    description: "Accès en lecture aux données et publicités",
    color: "#16a34a",
    isSystem: true,
    isActive: true,
    permissions: [
      "dashboard_read",
      "publicities_read"
    ]
  }
];

export async function initializeRolesAndPermissions() {
  try {
    console.log("Initializing roles and permissions...");

    // Créer les permissions
    const existingPermissions = await storage.getPermissions();
    const existingPermissionNames = existingPermissions.map(p => p.name);

    for (const permissionData of defaultPermissions) {
      if (!existingPermissionNames.includes(permissionData.name)) {
        await storage.createPermission(permissionData);
        console.log(`Created permission: ${permissionData.name}`);
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
          displayName: roleData.displayName,
          description: roleData.description,
          color: roleData.color,
          isSystem: roleData.isSystem,
          isActive: roleData.isActive
        });

        // Assigner les permissions
        const permissionIds = roleData.permissions
          .map(permName => permissionMap.get(permName))
          .filter(id => id !== undefined) as number[];
          
        await storage.setRolePermissions(newRole.id, permissionIds);
        console.log(`Created role: ${roleData.name} with ${permissionIds.length} permissions`);
      }
    }

    console.log("Roles and permissions initialization completed");
  } catch (error) {
    console.error("Error initializing roles and permissions:", error);
    throw error;
  }
}