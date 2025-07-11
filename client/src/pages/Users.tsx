import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Search, 
  UserCog, 
  Plus,
  Users,
  Edit,
  Trash2,
  Crown,
  Shield,
  User
} from "lucide-react";
import type { UserWithGroups, Group } from "@shared/schema";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithGroups | null>(null);
  const [userGroups, setUserGroups] = useState<number[]>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee" as const,
  });
  
  // Form states for creating user
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "employee" as const,
  });

  const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true' || import.meta.env.MODE === 'development';

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithGroups[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin',
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: user?.role === 'admin',
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      await apiRequest("PUT", `/api/users/${data.userId}`, { role: data.role });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rôle utilisateur mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/users/${data.id}`, data.updates);
      return response;
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });
      
      // Update the form with the response data before closing
      if (updatedUser) {
        setEditForm({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          username: updatedUser.username || '',
          email: updatedUser.email || '',
          role: updatedUser.role || 'employee',
          password: ''
        });
        
        // Update selected user as well
        setSelectedUser(prev => prev ? {...prev, ...updatedUser} : null);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Delay modal close to show the updated data
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedUser(null);
      }, 1000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const payload = {
        ...userData,
        id: userData.email.split('@')[0] + '_' + Date.now(), // Simple ID generation
      };
      
      // Only include password for local auth
      if (USE_LOCAL_AUTH && userData.password) {
        payload.password = userData.password;
      }
      
      const response = await apiRequest("POST", "/api/users", payload);
      return response;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: async (data: { userId: string; groupId: number }) => {
      await apiRequest("POST", `/api/users/${data.userId}/groups`, { groupId: data.groupId });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Utilisateur assigné au groupe avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'assigner l'utilisateur au groupe",
        variant: "destructive",
      });
    },
  });

  const removeGroupMutation = useMutation({
    mutationFn: async (data: { userId: string; groupId: number }) => {
      await apiRequest("DELETE", `/api/users/${data.userId}/groups/${data.groupId}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Utilisateur retiré du groupe avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'utilisateur du groupe",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'employee':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-yellow-100 text-yellow-800">Administrateur</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'employee':
        return <Badge className="bg-gray-100 text-gray-800">Employé</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
    setNewUser({ email: "", firstName: "", lastName: "", password: "", role: "employee" });
    setUserGroups([]);
  };

  const handleSubmitCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (!newUser.password) {
      toast({
        title: "Erreur",
        description: "Le mot de passe est obligatoire",
        variant: "destructive",
      });
      return;
    }

    // First create the user
    try {
      const createdUser = await createUserMutation.mutateAsync(newUser);
      
      // Then assign groups if any selected
      if (userGroups.length > 0) {
        await Promise.all(
          userGroups.map(groupId =>
            assignGroupMutation.mutateAsync({ userId: createdUser.id, groupId })
          )
        );
      }
      
      toast({
        title: "Succès",
        description: `Utilisateur créé et assigné à ${userGroups.length} magasin(s)`,
      });
      
      setShowCreateModal(false);
      setNewUser({ email: "", firstName: "", lastName: "", password: "", role: "employee" });
      setUserGroups([]);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    } catch (error) {
      // Error handling is already done in the mutations
    }
  };

  const handleEditUser = (userData: UserWithGroups) => {
    // Convert the single 'name' field to firstName/lastName
    const [firstName = '', ...lastNameParts] = (userData.name || '').split(' ');
    const lastName = lastNameParts.join(' ');
    
    const userWithNames = {
      ...userData,
      firstName,
      lastName
    };
    
    setSelectedUser(userWithNames);
    setEditForm({
      username: userData.username || "",
      firstName: firstName,
      lastName: lastName,
      email: userData.email || "",
      password: "",
      role: userData.role as "admin" | "manager" | "employee",
    });
    setShowEditModal(true);
  };

  const handleGroupManager = (userData: UserWithGroups) => {
    setSelectedUser(userData);
    setUserGroups(userData.userGroups.map(ug => ug.groupId));
    setShowGroupModal(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updates: any = {
      username: editForm.username,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      role: editForm.role,
    };

    // Only include password if it's not empty
    if (editForm.password.trim()) {
      updates.password = editForm.password;
    }

    updateUserMutation.mutate({
      id: selectedUser.id,
      updates
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === user?.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas modifier votre propre rôle",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir modifier le rôle de cet utilisateur ?")) {
      updateUserRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleToggleGroup = (userId: string, groupId: number, isAssigned: boolean) => {
    if (isAssigned) {
      removeGroupMutation.mutate({ userId, groupId });
    } else {
      assignGroupMutation.mutate({ userId, groupId });
    }
  };

  const handleDeleteUser = (userToDelete: UserWithGroups) => {
    if (userToDelete.id === user?.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas supprimer votre propre compte",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete.firstName} ${userToDelete.lastName} ? Cette action est irréversible.`)) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const canManage = user?.role === 'admin';

  if (!canManage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès restreint
          </h2>
          <p className="text-gray-600">
            Seuls les administrateurs peuvent accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <UserCog className="w-6 h-6 mr-3 text-blue-600" />
              Gestion des Utilisateurs
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Button
            onClick={handleCreateUser}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un utilisateur
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border border-gray-300 shadow-sm"
              />
            </div>
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48 border border-gray-300 shadow-sm">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-auto">
        {usersLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-center max-w-md">
              {searchTerm || roleFilter !== "all" 
                ? "Aucun utilisateur ne correspond à vos critères de recherche."
                : "Aucun utilisateur n'est encore enregistré dans le système."}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groupes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                              {userData.profileImageUrl ? (
                                <img 
                                  src={userData.profileImageUrl} 
                                  alt="Profile" 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-medium">
                                  {getInitials(userData.name?.split(' ')[0] || '', userData.name?.split(' ').slice(1).join(' ') || '')}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {userData.name || 'Nom non renseigné'}
                                {userData.id === user?.id && (
                                  <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {userData.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userData.email || 'Non renseigné'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRoleIcon(userData.role)}
                            <span className="ml-2">{getRoleBadge(userData.role)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {userData.userGroups.length === 0 ? (
                              <span className="text-sm text-gray-500">Aucun groupe</span>
                            ) : (
                              userData.userGroups.map((userGroup) => (
                                <Badge 
                                  key={userGroup.groupId} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  <div className="flex items-center">
                                    <div 
                                      className="w-2 h-2 rounded-full mr-1"
                                      style={{ backgroundColor: userGroup.group.color }}
                                    />
                                    {userGroup.group.name}
                                  </div>
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Select
                              value={userData.role}
                              onValueChange={(value) => handleRoleChange(userData.id, value)}
                              disabled={userData.id === user?.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="employee">Employé</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(userData)}
                              title="Modifier l'utilisateur"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGroupManager(userData)}
                              title="Gérer les groupes"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(userData)}
                              disabled={userData.id === user?.id || deleteUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Dialog open={showEditModal} onOpenChange={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}>
          <DialogContent className="sm:max-w-lg" aria-describedby="edit-user-modal-description">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium">
                Modifier l'utilisateur
              </DialogTitle>
              <p id="edit-user-modal-description" className="text-sm text-gray-600 mt-1">
                Modifier les informations de l'utilisateur {selectedUser.name || selectedUser.firstName + ' ' + selectedUser.lastName}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">Prénom *</Label>
                  <Input
                    id="edit-firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Nom *</Label>
                  <Input
                    id="edit-lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-username">Identifiant *</Label>
                <Input
                  id="edit-username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  placeholder="Identifiant de connexion"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="email@exemple.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Laisser vide pour ne pas changer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 6 caractères. Laissez vide pour conserver le mot de passe actuel.
                </p>
              </div>

              <div>
                <Label htmlFor="edit-role">Rôle *</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value) => setEditForm({...editForm, role: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateUserMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Group Management Modal */}
      {showGroupModal && selectedUser && (
        <Dialog open={showGroupModal} onOpenChange={() => {
          setShowGroupModal(false);
          setSelectedUser(null);
          setUserGroups([]);
        }}>
          <DialogContent className="sm:max-w-md" aria-describedby="group-modal-description">
            <DialogHeader>
              <DialogTitle>
                Gérer les Groupes - {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
              <p id="group-modal-description" className="text-sm text-gray-600 mt-1">
                Assigner ou retirer cet utilisateur des groupes/magasins
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Groupes disponibles</Label>
                <div className="space-y-2 mt-2">
                  {groups.map((group) => {
                    const isAssigned = selectedUser.userGroups.some(ug => ug.groupId === group.id);
                    return (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-sm font-medium">{group.name}</span>
                        </div>
                        <Button
                          variant={isAssigned ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleToggleGroup(selectedUser.id, group.id, isAssigned)}
                          disabled={assignGroupMutation.isPending || removeGroupMutation.isPending}
                        >
                          {isAssigned ? 'Retirer' : 'Assigner'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowGroupModal(false);
                    setSelectedUser(null);
                    setUserGroups([]);
                  }}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md" aria-describedby="create-user-modal-description">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Créer un nouvel utilisateur
              </DialogTitle>
              <p id="create-user-modal-description" className="text-sm text-gray-600 mt-1">
                Créer un nouveau compte utilisateur avec ses permissions
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@exemple.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Mot de passe pour se connecter à l'application
                </p>
              </div>

              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: "admin" | "manager" | "employee") => 
                    setNewUser({...newUser, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Magasins assignés</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={userGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUserGroups([...userGroups, group.id]);
                          } else {
                            setUserGroups(userGroups.filter(id => id !== group.id));
                          }
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <Label htmlFor={`group-${group.id}`} className="text-sm">
                          {group.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: "", firstName: "", lastName: "", role: "employee" });
                    setUserGroups([]);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSubmitCreateUser}
                  disabled={createUserMutation.isPending}
                  className="flex-1"
                >
                  {createUserMutation.isPending ? "Création..." : "Créer l'utilisateur"}
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
