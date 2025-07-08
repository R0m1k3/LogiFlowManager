import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [selectedUser, setSelectedUser] = useState<UserWithGroups | null>(null);
  const [userGroups, setUserGroups] = useState<number[]>([]);

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

  const handleEditUser = (user: UserWithGroups) => {
    setSelectedUser(user);
    setUserGroups(user.userGroups.map(ug => ug.groupId));
    setShowEditModal(true);
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
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCog className="w-6 h-6 mr-2 text-primary" />
              Gestion des Utilisateurs
            </h2>
            <p className="text-gray-600">
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
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
                                  {getInitials(userData.firstName, userData.lastName)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {userData.firstName} {userData.lastName}
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
                            >
                              <Edit className="w-4 h-4" />
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
          setUserGroups([]);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Gérer les Groupes - {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
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
                    setShowEditModal(false);
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
    </div>
  );
}
