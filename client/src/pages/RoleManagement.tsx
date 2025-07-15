import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Plus, Edit, Trash2, Settings, Lock, UserCheck } from "lucide-react";

interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  isActive: boolean;
  isSystem: boolean;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  action: string;
}

interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export default function RoleManagement() {
  const { user } = useAuthUnified();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#6b7280",
    isActive: true,
  });

  // Protection admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
              <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Queries avec protection React Error #310
  const { data: rolesData = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    retry: 1,
  });

  const { data: permissionsData = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
    retry: 1,
  });

  // **PROTECTION CRITIQUE REACT ERROR #310**
  const safeRoles = Array.isArray(rolesData) ? rolesData : [];
  const safePermissions = Array.isArray(permissionsData) ? permissionsData : [];

  console.log('🔐 RoleManagement SAFE data:', { 
    rolesCount: safeRoles.length,
    permissionsCount: safePermissions.length,
    rolesType: typeof rolesData,
    permissionsType: typeof permissionsData,
    isRolesArray: Array.isArray(rolesData),
    isPermissionsArray: Array.isArray(permissionsData)
  });

  // Filtrage sécurisé
  const filteredRoles = safeRoles.filter(role => 
    role?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof roleForm) => {
      return await apiRequest("/api/roles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Rôle créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de créer le rôle",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<typeof roleForm> }) => {
      return await apiRequest(`/api/roles/${data.id}`, {
        method: "PUT",
        body: data.updates,
      });
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Rôle mis à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowEditModal(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await apiRequest(`/api/roles/${roleId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Rôle supprimé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de supprimer le rôle",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissionIds: number[] }) => {
      return await apiRequest(`/api/roles/${data.roleId}/permissions`, {
        method: "POST",
        body: { permissionIds: data.permissionIds },
      });
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Permissions mises à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowPermissionsModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour les permissions",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const resetForm = () => {
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
      color: "#6b7280",
      isActive: true,
    });
  };

  const handleCreateRole = () => {
    setShowCreateModal(true);
    resetForm();
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role as RoleWithPermissions);
    setRoleForm({
      name: role.name || "",
      displayName: role.displayName || "",
      description: role.description || "",
      color: role.color || "#6b7280",
      isActive: role.isActive ?? true,
    });
    setShowEditModal(true);
  };

  const handleManagePermissions = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
    setSelectedPermissions(rolePermissions.map(p => p.id));
    setShowPermissionsModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer un rôle système",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate(roleForm);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    updateRoleMutation.mutate({ id: selectedRole.id, updates: roleForm });
  };

  const handleSubmitPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getRoleStatusBadge = (role: Role) => {
    if (role.isSystem) {
      return <Badge variant="secondary">Système</Badge>;
    }
    return role.isActive ? (
      <Badge className="bg-green-100 text-green-800">Actif</Badge>
    ) : (
      <Badge variant="outline">Inactif</Badge>
    );
  };

  // Grouper les permissions par catégorie
  const groupedPermissions = safePermissions.reduce((acc, permission) => {
    const category = permission?.category || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Gestion des Rôles
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les rôles utilisateur et leurs permissions
          </p>
        </div>
        <Button onClick={handleCreateRole} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer un rôle
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Rechercher un rôle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(filteredRoles) && filteredRoles.length > 0 ? (
          filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color || '#6b7280' }}
                    />
                    <CardTitle className="text-lg">{role.displayName || role.name}</CardTitle>
                  </div>
                  {getRoleStatusBadge(role)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {role.description || 'Aucune description'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Permissions: {Array.isArray(role.permissions) ? role.permissions.length : 0}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagePermissions(role as RoleWithPermissions)}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Permissions
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rôle trouvé</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Aucun rôle ne correspond à votre recherche.' : 'Commencez par créer un rôle.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rôle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom technique</label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: manager_store"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nom d'affichage</label>
              <Input
                value={roleForm.displayName}
                onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="ex: Manager de magasin"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du rôle"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Couleur</label>
              <Input
                type="color"
                value={roleForm.color}
                onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={roleForm.isActive}
                onCheckedChange={(checked) => setRoleForm(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm">Rôle actif</label>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom technique</label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={selectedRole?.isSystem}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nom d'affichage</label>
              <Input
                value={roleForm.displayName}
                onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Couleur</label>
              <Input
                type="color"
                value={roleForm.color}
                onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={roleForm.isActive}
                onCheckedChange={(checked) => setRoleForm(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm">Rôle actif</label>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Gérer les permissions - {selectedRole?.displayName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPermissions}>
            <ScrollArea className="max-h-96 pr-4">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <UserCheck className="w-4 h-4 mr-2" />
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2 ml-6">
                      {Array.isArray(permissions) && permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <label className="text-sm font-medium">
                              {permission.displayName}
                            </label>
                            {permission.description && (
                              <p className="text-xs text-gray-500">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowPermissionsModal(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={updatePermissionsMutation.isPending}>
                {updatePermissionsMutation.isPending ? 'Mise à jour...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}