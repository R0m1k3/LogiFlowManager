import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Search, 
  Users, 
  Edit,
  Trash2,
  Package,
  Truck,
  Palette
} from "lucide-react";
import type { Group } from "@shared/schema";

const colorOptions = [
  { value: '#1976D2', label: 'Bleu' },
  { value: '#388E3C', label: 'Vert' },
  { value: '#FF6F00', label: 'Orange' },
  { value: '#D32F2F', label: 'Rouge' },
  { value: '#7B1FA2', label: 'Violet' },
  { value: '#F57C00', label: 'Ambre' },
  { value: '#5D4037', label: 'Marron' },
  { value: '#455A64', label: 'Bleu gris' },
  { value: '#E91E63', label: 'Rose' },
  { value: '#00796B', label: 'Sarcelle' },
];

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#1976D2",
  });

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['/api/deliveries'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/groups", data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Groupe créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setShowCreateModal(false);
      setFormData({ name: "", color: "#1976D2" });
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
        description: "Impossible de créer le groupe",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/groups/${selectedGroup?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Groupe modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setShowEditModal(false);
      setSelectedGroup(null);
      setFormData({ name: "", color: "#1976D2" });
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
        description: "Impossible de modifier le groupe",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Groupe supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
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
        description: "Impossible de supprimer le groupe",
        variant: "destructive",
      });
    },
  });

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupStats = (groupId: number) => {
    const groupOrders = orders.filter(order => order.groupId === groupId);
    const groupDeliveries = deliveries.filter(delivery => delivery.groupId === groupId);
    
    return {
      orders: groupOrders.length,
      deliveries: groupDeliveries.length,
      delivered: groupDeliveries.filter(d => d.status === 'delivered').length,
    };
  };

  const handleCreate = () => {
    setFormData({ name: "", color: "#1976D2" });
    setShowCreateModal(true);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      color: group.color,
    });
    setShowEditModal(true);
  };

  const handleDelete = (group: Group) => {
    const stats = getGroupStats(group.id);
    
    if (stats.orders > 0 || stats.deliveries > 0) {
      toast({
        title: "Suppression impossible",
        description: "Ce groupe a des commandes ou livraisons associées",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est requis",
        variant: "destructive",
      });
      return;
    }

    if (selectedGroup) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-600" />
              Gestion des Groupes/Magasins
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredGroups.length} groupe{filteredGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canManage && (
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Groupe
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border border-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "Aucun groupe trouvé" : "Aucun groupe"}
            </h3>
            <p className="text-center max-w-md">
              {searchTerm 
                ? "Aucun groupe ne correspond à votre recherche."
                : "Vous n'avez pas encore de groupes. Créez votre premier groupe pour commencer."}
            </p>
            {!searchTerm && canManage && (
              <Button
                onClick={handleCreate}
                className="mt-4 bg-primary hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un groupe
              </Button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const stats = getGroupStats(group.id);
                return (
                  <div key={group.id} className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 flex items-center justify-center mr-3"
                          style={{ backgroundColor: group.color }}
                        >
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">#{group.id}</p>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center mb-4">
                      <Palette className="w-4 h-4 mr-2 text-gray-500" />
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm text-gray-600">{group.color}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center text-primary mb-1">
                            <Package className="w-4 h-4 mr-1" />
                            <span className="font-semibold">{stats.orders}</span>
                          </div>
                          <p className="text-xs text-gray-500">Commandes</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center text-secondary mb-1">
                            <Truck className="w-4 h-4 mr-1" />
                            <span className="font-semibold">{stats.deliveries}</span>
                          </div>
                          <p className="text-xs text-gray-500">Livraisons</p>
                        </div>
                      </div>
                      {stats.deliveries > 0 && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-500">
                            {stats.delivered} livrées ({Math.round((stats.delivered / stats.deliveries) * 100)}%)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={() => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedGroup(null);
        setFormData({ name: "", color: "#1976D2" });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedGroup ? 'Modifier' : 'Nouveau'} Groupe
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du groupe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du groupe/magasin"
                required
              />
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: formData.color }}
                  />
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-gray-500">{formData.color}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        formData.color === option.value ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: option.value }}
                      onClick={() => handleChange('color', option.value)}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedGroup(null);
                  setFormData({ name: "", color: "#1976D2" });
                }}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..." 
                  : (selectedGroup ? "Modifier" : "Créer")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
