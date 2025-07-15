import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck,
  Lock,
  Unlock,
  FileText,
} from "lucide-react";
import type { Role, Permission, RoleWithPermissions } from "@shared/schema";

// Form schemas
const roleFormSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").regex(/^[a-z_]+$/, "Le nom doit contenir uniquement des lettres minuscules et underscores"),
  displayName: z.string().min(1, "Le nom d'affichage est obligatoire"),
  description: z.string().optional(),
  color: z.string().default("#6b7280"),
  isActive: z.boolean().default(true),
});

type RoleForm = z.infer<typeof roleFormSchema>;

export default function RoleManagement() {
  const { user } = useAuthUnified();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debug et vérification admin
  console.log('🔐 RoleManagement user check:', { 
    userExists: !!user, 
    userRole: user?.role, 
    isAdmin: user?.role === 'admin',
    userObject: user 
  });
  
  // Protection contre utilisateur non connecté ou non admin
  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connexion requise</h3>
              <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
              <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
              <p className="text-sm text-gray-500 mt-2">Rôle actuel: {user.role}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      color: "#6b7280",
      isActive: true,
    },
  });

  // Queries avec protection
  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleWithPermissions[]>({
    queryKey: ['/api/roles'],
  });

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
  });

  // Protection React Error #310 - Vérification Array
  console.log('🔐 RoleManagement data:', { 
    rolesLoading, 
    rolesCount: Array.isArray(roles) ? roles.length : 'NOT_ARRAY',
    permissionsCount: Array.isArray(permissions) ? permissions.length : 'NOT_ARRAY',
    rolesType: typeof roles,
    permissionsType: typeof permissions 
  });
  
  // Protection: s'assurer que roles et permissions sont des arrays
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleForm) => {
      return await apiRequest("/api/roles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rôle créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowCreateModal(false);
      form.reset();
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
    mutationFn: async (data: { id: number; updates: Partial<RoleForm> }) => {
      return await apiRequest(`/api/roles/${data.id}`, {
        method: "PUT",
        body: data.updates,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rôle mis à jour avec succès",
      });
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
      return await apiRequest(`/api/roles/${roleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rôle supprimé avec succès",
      });
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

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissionIds: number[] }) => {
      return await apiRequest(`/api/roles/${data.roleId}/permissions`, {
        method: "POST",
        body: {
          permissionIds: data.permissionIds,
        },
      });
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Succès",
        description: "Permissions mises à jour avec succès",
      });
      // Invalider et attendre la mise à jour des données
      await queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      
      // Mettre à jour l'état local du rôle sélectionné
      const updatedRoles = await queryClient.getQueryData<RoleWithPermissions[]>(['/api/roles']);
      if (updatedRoles && selectedRole) {
        const updatedRole = updatedRoles.find(r => r.id === selectedRole.id);
        if (updatedRole) {
          setSelectedRole(updatedRole);
        }
      }
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
  const handleCreateRole = () => {
    setShowCreateModal(true);
    form.reset();
  };

  const handleEditRole = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    form.reset({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      color: role.color || "#6b7280",
      isActive: role.isActive,
    });
    setShowEditModal(true);
  };

  const handleManagePermissions = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const handleDeleteRole = (role: RoleWithPermissions) => {
    if (role.isSystem) {
      toast({
        title: "Erreur",
        description: "Les rôles système ne peuvent pas être supprimés",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const onSubmit = (data: RoleForm) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, updates: data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handlePermissionChange = (permissionIds: number[]) => {
    if (selectedRole) {
      // Mettre à jour immédiatement l'état local pour un feedback visuel instantané
      const updatedRolePermissions = permissionIds.map(permissionId => ({
        roleId: selectedRole.id,
        permissionId,
      }));
      
      setSelectedRole({
        ...selectedRole,
        rolePermissions: updatedRolePermissions,
      });

      // Puis envoyer la mise à jour au serveur
      updateRolePermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissionIds,
      });
    }
  };

  console.log('👥 RoleManagement Debug:', {
    roles: Array.isArray(roles) ? roles.length : 'NOT_ARRAY',
    rolesLoading,
    permissions: Array.isArray(permissions) ? permissions.length : 'NOT_ARRAY',
    rolesData: roles?.slice(0, 2)
  });

  // Filter roles - with safety checks renforcées
  const filteredRoles = (() => {
    if (!Array.isArray(roles)) {
      console.warn('⚠️ RoleManagement: roles is not an array', typeof roles, roles);
      return [];
    }
    
    return roles.filter(role => {
      if (!role || typeof role !== 'object') {
        console.warn('⚠️ RoleManagement: invalid role object', role);
        return false;
      }
      
      const displayName = role.displayName || role.name || '';
      const name = role.name || '';
      const searchLower = (searchTerm || '').toLowerCase();
      
      return displayName.toLowerCase().includes(searchLower) ||
             name.toLowerCase().includes(searchLower);
    });
  })();

  // Group permissions by category - avec protection renforcée
  const permissionsByCategory = (() => {
    if (!Array.isArray(permissions)) {
      console.warn('⚠️ RoleManagement: permissions is not an array', typeof permissions, permissions);
      return {};
    }
    
    return permissions.reduce((acc, permission) => {
      if (!permission || typeof permission !== 'object' || !permission.category) {
        console.warn('⚠️ RoleManagement: invalid permission object', permission);
        return acc;
      }
      
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  })();

  const getRoleIcon = (role: RoleWithPermissions) => {
    if (!role || !role.name) return <Users className="w-5 h-5 text-gray-500" />;
    
    if (role.name === 'admin') return <Crown className="w-5 h-5 text-yellow-500" />;
    if (role.name === 'manager') return <Shield className="w-5 h-5 text-blue-500" />;
    if (role.name === 'employee') return <UserCheck className="w-5 h-5 text-green-500" />;
    return <Users className="w-5 h-5 text-gray-500" />;
  };

  const getPermissionIcon = (action: string) => {
    switch (action) {
      case 'read': return <Eye className="w-4 h-4" />;
      case 'create': return <Plus className="w-4 h-4" />;
      case 'update': return <Edit className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      case 'validate': return <CheckCircle className="w-4 h-4" />;
      case 'print': return <FileText className="w-4 h-4" />;
      case 'notify': return <Users className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'dashboard': 'Tableau de bord',
      'calendar': 'Calendrier',
      'orders': 'Commandes',
      'deliveries': 'Livraisons',
      'reconciliation': 'Rapprochement',
      'users': 'Utilisateurs',
      'groups': 'Magasins',
      'suppliers': 'Fournisseurs',
      'publicities': 'Publicités',
      'customer_orders': 'Commandes Client',
      'roles': 'Rôles'
    };
    return categoryMap[category] || category;
  };

  if (rolesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg shadow-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Rôles</h1>
          <p className="text-gray-600 mt-2">Créez et gérez les rôles et permissions du système</p>
        </div>
        <Button onClick={handleCreateRole} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rôle
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Rechercher un rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-sm"
          />
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {Array.isArray(filteredRoles) ? filteredRoles.length : 0} rôle{(Array.isArray(filteredRoles) ? filteredRoles.length : 0) > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(filteredRoles) && filteredRoles.length > 0 ? filteredRoles.map((role) => {
          if (!role || !role.id) {
            console.warn('⚠️ RoleManagement: invalid role in map', role);
            return null;
          }
          
          return (
          <Card key={role.id} className="shadow-sm hover:shadow-md transition-all duration-200 border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRoleIcon(role)}
                  <div>
                    <CardTitle className="text-lg font-semibold">{role.displayName || role.name || 'Rôle sans nom'}</CardTitle>
                    <p className="text-sm text-gray-500">{role.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      Système
                    </Badge>
                  )}
                  {role.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {role.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{role.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Permissions:</span>
                <Badge variant="outline" className="text-xs">
                  {Array.isArray(role.rolePermissions) ? role.rolePermissions.length : 0}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManagePermissions(role)}
                  className="shadow-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Permissions
                </Button>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rôle trouvé</h3>
            <p className="text-gray-600">Aucun rôle ne correspond à votre recherche.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedRole(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl border-gray-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {selectedRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'affichage *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Gestionnaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom technique *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: manager" {...field} />
                    </FormControl>
                    <FormDescription>
                      Utilisé en interne, uniquement lettres minuscules et underscores
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description du rôle..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Rôle actif</FormLabel>
                      <FormDescription>
                        Les rôles inactifs ne peuvent pas être assignés
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="shadow-sm"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  {selectedRole ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={(open) => {
        if (!open) {
          setShowPermissionsModal(false);
          setSelectedRole(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl shadow-xl border-gray-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              Permissions - {selectedRole?.displayName}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-96 pr-4">
            <div className="space-y-6">
              {Object.entries(permissionsByCategory || {}).map(([category, categoryPermissions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    {getCategoryDisplayName(category)}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.isArray(categoryPermissions) && categoryPermissions.map((permission) => {
                      const isChecked = selectedRole?.rolePermissions?.some(
                        rp => rp.permissionId === permission.id
                      ) || false;

                      return (
                        <div key={permission.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (!selectedRole) return;
                              
                              const currentPermissionIds = Array.isArray(selectedRole.rolePermissions) ? selectedRole.rolePermissions.map(rp => rp.permissionId) : [];
                              let newPermissionIds;
                              
                              if (checked) {
                                newPermissionIds = [...currentPermissionIds, permission.id];
                              } else {
                                newPermissionIds = currentPermissionIds.filter(id => id !== permission.id);
                              }
                              
                              handlePermissionChange(newPermissionIds);
                            }}
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            {getPermissionIcon(permission.action)}
                            <div>
                              <label
                                htmlFor={`permission-${permission.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.displayName}
                              </label>
                              {permission.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
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
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowPermissionsModal(false)}
              className="shadow-sm"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}