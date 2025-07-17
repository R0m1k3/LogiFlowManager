import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getRoleColor, getRoleDisplayName, ROLE_COLORS } from "@/lib/roleUtils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Shield, Users, Settings } from "lucide-react";
import type { Role, Permission, User } from "@shared/schema";

interface RoleWithPermissions extends Role {
  rolePermissions: Array<{
    roleId: number;
    permissionId: number;
    createdAt: Date;
    permission: Permission;
  }>;
}

interface UserWithRoles extends User {
  userRoles: Array<{
    userId: string;
    roleId: number;
    assignedBy: string;
    assignedAt: Date;
    role: Role;
  }>;
}

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles 
  const { data: rolesData = [], isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false
  });

  // Fetch permissions with forced refetch
  const { data: permissionsData = [], isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false
  });

  // Force refresh permissions on mount
  useEffect(() => {
    refetchPermissions();
  }, [refetchPermissions]);

  // Debug function to force refresh permissions
  const forceRefreshPermissions = () => {
    console.log("🔄 Force refreshing permissions...");
    queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    refetchPermissions();
  };



  // Protection Array.isArray et logs debug RENFORCÉS
  const roles = Array.isArray(rolesData) ? rolesData : [];
  const permissions = Array.isArray(permissionsData) ? permissionsData : [];



  console.log("📊 RoleManagement Data:", {
    roles: roles.length,
    permissions: permissions.length
  });



  // Debug des couleurs spécifiquement
  console.log("🎨 Colors Debug:", roles.map(role => ({
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    color: role.color,
    hasColor: !!role.color
  })));

  // Force log the rendering decision
  console.log("🔍 Render Decision:", {
    showLoading: rolesLoading,
    showError: !!rolesError,
    showEmpty: !rolesLoading && !rolesError && roles.length === 0,
    showRoles: !rolesLoading && !rolesError && roles.length > 0,
    finalCondition: !rolesLoading && !rolesError && roles.length > 0
  });

  // Get role with permissions
  const { data: roleWithPermissions } = useQuery<RoleWithPermissions>({
    queryKey: ['/api/roles', selectedRole?.id],
    enabled: !!selectedRole,
  });

  // Get role permissions specifically
  const { data: rolePermissions = [] } = useQuery<any[]>({
    queryKey: [`/api/roles/${selectedRole?.id}/permissions`],
    enabled: !!selectedRole,
  });

  // Debug permissions
  console.log("🔍 Permissions Debug:", {
    selectedRole: selectedRole?.name,
    selectedRoleId: selectedRole?.id,
    rolePermissionsLength: rolePermissions?.length,
    permissionsLength: permissions.length,
    rolePermissionsSample: rolePermissions?.slice(0, 2)
  });

  // Traduction des catégories en français
  const categoryTranslations: Record<string, string> = {
    'administration': 'Administration',
    'calendrier': 'Calendrier',
    'commandes': 'Commandes',
    'commandes_clients': 'Commandes Clients',
    'fournisseurs': 'Fournisseurs',
    'gestion_dlc': 'Gestion DLC',
    'gestion_roles': 'Gestion des Rôles',
    'livraisons': 'Livraisons',
    'magasins': 'Magasins',
    'publicites': 'Publicités',
    'rapprochement': 'Rapprochement',
    'tableau_de_bord': 'Tableau de Bord',
    'utilisateurs': 'Utilisateurs',
    // Fallbacks pour les anciennes catégories en anglais
    'Calendar': 'Calendrier',
    'Dashboard': 'Tableau de Bord',
    'Deliveries': 'Livraisons',
    'Magasins': 'Magasins',
    'Orders': 'Commandes',
    'Publicities': 'Publicités',
    'Reconciliation': 'Rapprochement',
    'Suppliers': 'Fournisseurs',
    'Customer Orders': 'Commandes Clients',
    'Users': 'Utilisateurs',
    'Roles': 'Gestion des Rôles',
    'Administration': 'Administration'
  };

  // Group permissions by category
  const permissionsByCategory = Array.isArray(permissions) ? permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>) : {};

  // Debug logs après déclaration de permissionsByCategory
  console.log("🔍 Permissions by Category Debug:", Object.keys(permissionsByCategory));
  console.log("🔍 Has gestion_dlc:", permissionsByCategory['gestion_dlc'] ? permissionsByCategory['gestion_dlc'].length : 'NOT FOUND');
  console.log("🔍 Full permissions sample:", permissions.slice(0, 3));

  // Debug logs après déclaration de permissionsByCategory
  console.log("🔍 Permissions by Category Debug:", Object.keys(permissionsByCategory));
  console.log("🔍 Has gestion_dlc:", permissionsByCategory['gestion_dlc'] ? permissionsByCategory['gestion_dlc'].length : 'NOT FOUND');
  console.log("🔍 Full permissions sample:", permissions.slice(0, 3));

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; displayName: string; description: string; color: string }) => {
      return await apiRequest('/api/roles', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setCreateRoleOpen(false);
      toast({ title: "Rôle créé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la création du rôle", description: error.message, variant: "destructive" });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; displayName: string; description: string; color: string }) => {
      return await apiRequest(`/api/roles/${data.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setEditRoleOpen(false);
      toast({ title: "Rôle modifié avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la modification du rôle", description: error.message, variant: "destructive" });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await apiRequest(`/api/roles/${roleId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({ title: "Rôle supprimé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la suppression du rôle", description: error.message, variant: "destructive" });
    },
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissionIds: number[] }) => {
      return await apiRequest(`/api/roles/${data.roleId}/permissions`, 'POST', { permissionIds: data.permissionIds });
    },
    onSuccess: () => {
      console.log("🚀 Permission mutation success - invalidating cache");
      
      // Invalider seulement les queries nécessaires
      if (selectedRole) {
        queryClient.invalidateQueries({ queryKey: [`/api/roles/${selectedRole.id}/permissions`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      
      toast({ title: "Permissions mises à jour avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la mise à jour des permissions", description: error.message, variant: "destructive" });
    },
  });



  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createRoleMutation.mutate({
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string,
    });
  };

  const handleUpdateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) return;
    
    const formData = new FormData(event.currentTarget);
    updateRoleMutation.mutate({
      id: selectedRole.id,
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string,
    });
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!selectedRole) return;
    
    const currentPermissions = rolePermissions?.map(rp => rp.permissionId) || [];
    const newPermissions = checked
      ? [...currentPermissions, permissionId]
      : currentPermissions.filter(id => id !== permissionId);

    console.log("🔍 Permission toggle:", {
      permissionId,
      checked,
      currentPermissions,
      newPermissions,
      roleId: selectedRole.id
    });

    updateRolePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: newPermissions,
    });
  };



  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Rôles et Permissions</h1>
          <p className="text-muted-foreground">Gérez les rôles utilisateurs et leurs permissions</p>
        </div>
        <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un Rôle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Rôle</DialogTitle>
              <DialogDescription>Ajoutez un nouveau rôle au système</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom technique</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="displayName">Nom d'affichage</Label>
                <Input id="displayName" name="displayName" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" name="color" type="color" defaultValue="#3B82F6" />
              </div>
              <Button type="submit" disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Rôles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Settings className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liste des Rôles</CardTitle>
                    <CardDescription>Sélectionnez un rôle pour voir ses permissions</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("🔄 Manual refetch triggered");
                      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
                      refetchRoles();
                    }}
                  >
                    🔄 Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="text-center py-4">Chargement des rôles...</div>
                ) : rolesError ? (
                  <div className="text-center py-4 text-red-500">
                    Erreur: {rolesError.message}
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucun rôle trouvé
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => {
                      // Utiliser la couleur de la base de données, avec fallback sur getRoleColor
                      const roleColor = role.color || getRoleColor(role.name);
                      return (
                        <div
                          key={role.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedRole?.id === role.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedRole(role)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ 
                                  backgroundColor: roleColor,
                                  borderColor: roleColor
                                }}
                                title={`Couleur: ${roleColor}`}
                              />
                              <span className="font-medium">{role.displayName}</span>
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-xs">Système</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRole(role);
                                  setEditRoleOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {!role.isSystem && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRoleMutation.mutate(role.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Permissions du Rôle</CardTitle>
                <CardDescription>
                  {selectedRole ? `Permissions pour ${selectedRole.displayName}` : 'Sélectionnez un rôle'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <div className="space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm">{categoryTranslations[category] || category}</h4>
                        <div className="space-y-1">
                          {Array.isArray(categoryPermissions) && categoryPermissions.map((permission) => {
                            const hasPermission = rolePermissions?.some(
                              rp => rp.permissionId === permission.id
                            );
                            // Debug permission check
                            if (permission.id === 1) {
                              console.log("🔍 Permission check for ID 1:", {
                                hasPermission,
                                rolePermissionsLength: rolePermissions?.length
                              });
                            }
                            return (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={hasPermission || false}
                                  onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                                />
                                <label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.displayName}
                                </label>
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Sélectionnez un rôle pour voir ses permissions</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des Permissions</CardTitle>
                  <CardDescription>Toutes les permissions disponibles dans le système</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceRefreshPermissions}
                >
                  🔄 Actualiser Permissions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-medium">{categoryTranslations[category] || category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Array.isArray(categoryPermissions) && categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{permission.displayName}</p>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                            {permission.isSystem && (
                              <Badge variant="secondary" className="text-xs">
                                Système
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Rôle</DialogTitle>
            <DialogDescription>Modifiez les informations du rôle</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nom technique</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedRole.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-displayName">Nom d'affichage</Label>
                <Input
                  id="edit-displayName"
                  name="displayName"
                  defaultValue={selectedRole.displayName}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={selectedRole.description || ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Couleur</Label>
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  defaultValue={selectedRole.color}
                />
              </div>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? 'Modification...' : 'Modifier'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}