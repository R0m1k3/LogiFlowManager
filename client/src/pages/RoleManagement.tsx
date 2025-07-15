import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, Settings, Plus, Edit, Trash2, Check, X } from "lucide-react";
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
  const [editUserRolesOpen, setEditUserRolesOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get role with permissions
  const { data: roleWithPermissions } = useQuery<RoleWithPermissions>({
    queryKey: ['/api/roles', selectedRole?.id],
    enabled: !!selectedRole,
  });

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
      setSelectedRole(null);
      toast({ title: "Rôle supprimé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la suppression du rôle", description: error.message, variant: "destructive" });
    },
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissionIds: number[] }) => {
      return await apiRequest(`/api/roles/${data.roleId}/permissions`, 'PUT', { permissionIds: data.permissionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles', selectedRole?.id] });
      toast({ title: "Permissions du rôle mises à jour" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la mise à jour des permissions", description: error.message, variant: "destructive" });
    },
  });

  // Update user roles mutation
  const updateUserRolesMutation = useMutation({
    mutationFn: async (data: { userId: string; roleIds: number[] }) => {
      return await apiRequest(`/api/users/${data.userId}/roles`, 'PUT', { roleIds: data.roleIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditUserRolesOpen(false);
      toast({ title: "Rôles utilisateur mis à jour" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de la mise à jour des rôles utilisateur", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string,
    };
    createRoleMutation.mutate(data);
  };

  const handleUpdateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) return;
    const formData = new FormData(event.currentTarget);
    const data = {
      id: selectedRole.id,
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string,
    };
    updateRoleMutation.mutate(data);
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!selectedRole) return;
    
    const currentPermissions = roleWithPermissions?.rolePermissions.map(rp => rp.permissionId) || [];
    const newPermissions = checked
      ? [...currentPermissions, permissionId]
      : currentPermissions.filter(id => id !== permissionId);

    updateRolePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: newPermissions,
    });
  };

  const handleUserRolesUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;
    
    const formData = new FormData(event.currentTarget);
    const roleIds = [];
    
    for (const role of roles) {
      if (formData.get(`role_${role.id}`)) {
        roleIds.push(role.id);
      }
    }

    updateUserRolesMutation.mutate({
      userId: selectedUser.id,
      roleIds,
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
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
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
                <CardTitle>Liste des Rôles</CardTitle>
                <CardDescription>Sélectionnez un rôle pour voir ses permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roles.map((role) => (
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
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
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
                  ))}
                </div>
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
                        <h4 className="font-medium text-sm capitalize">{category}</h4>
                        <div className="space-y-1">
                          {categoryPermissions.map((permission) => {
                            const hasPermission = roleWithPermissions?.rolePermissions.some(
                              rp => rp.permissionId === permission.id
                            );
                            return (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={hasPermission || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(permission.id, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.displayName}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sélectionnez un rôle pour voir ses permissions</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Rôles Utilisateurs</CardTitle>
              <CardDescription>Attribuez des rôles aux utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name || user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user as UserWithRoles);
                          setEditUserRolesOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier Rôles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Permissions</CardTitle>
              <CardDescription>Toutes les permissions disponibles dans le système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-medium capitalize">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryPermissions.map((permission) => (
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

      {/* Edit User Roles Dialog */}
      <Dialog open={editUserRolesOpen} onOpenChange={setEditUserRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les Rôles Utilisateur</DialogTitle>
            <DialogDescription>
              Attribuez des rôles à {selectedUser?.name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUserRolesUpdate} className="space-y-4">
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-role-${role.id}`}
                      name={`role_${role.id}`}
                      defaultChecked={selectedUser.role === role.name}
                    />
                    <label
                      htmlFor={`user-role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.displayName}
                    </label>
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={updateUserRolesMutation.isPending}>
                {updateUserRolesMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}