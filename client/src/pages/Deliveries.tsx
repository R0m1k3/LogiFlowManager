import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Building,
  User,
  Check,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CreateDeliveryModal from "@/components/modals/CreateDeliveryModal";
import EditDeliveryModal from "@/components/modals/EditDeliveryModal";
import OrderDetailModal from "@/components/modals/OrderDetailModal";
import type { DeliveryWithRelations } from "@shared/schema";

export default function Deliveries() {
  const { user } = useAuth();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithRelations | null>(null);

  // Construire l'URL pour l'historique complet sans filtrage par date
  const deliveriesUrl = `/api/deliveries${selectedStoreId && user?.role === 'admin' ? `?storeId=${selectedStoreId}` : ''}`;
  
  const { data: deliveries = [], isLoading } = useQuery<DeliveryWithRelations[]>({
    queryKey: [deliveriesUrl, selectedStoreId],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
  });

  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/deliveries/${id}/validate`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Livraison validée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
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
        description: "Impossible de valider la livraison",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/deliveries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Livraison supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
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
        description: "Impossible de supprimer la livraison",
        variant: "destructive",
      });
    },
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.group?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.comments?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    const matchesGroup = groupFilter === "all" || delivery.groupId.toString() === groupFilter;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Livré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit === 'palettes' ? 'P' : 'C'}`;
  };

  const handleViewDelivery = (delivery: DeliveryWithRelations) => {
    setSelectedDelivery({ ...delivery, type: 'delivery' });
    setShowDetailModal(true);
  };

  const handleEditDelivery = (delivery: DeliveryWithRelations) => {
    setSelectedDelivery(delivery);
    setShowEditModal(true);
  };

  const handleValidateDelivery = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir valider cette livraison ?")) {
      validateMutation.mutate(id);
    }
  };

  const handleDeleteDelivery = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette livraison ?")) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = true; // All users can create deliveries
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const canValidate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Truck className="w-6 h-6 mr-2 text-secondary" />
              Gestion des Livraisons
            </h2>
            <p className="text-gray-600">
              {filteredDeliveries.length} livraison{filteredDeliveries.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Livraison
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par fournisseur, groupe ou commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="delivered">Livré</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-48">
              <Building className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <span>{group.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Truck className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Aucune livraison trouvée</h3>
            <p className="text-center max-w-md">
              {searchTerm || statusFilter !== "all" || groupFilter !== "all" 
                ? "Aucune livraison ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de livraisons. Créez votre première livraison pour commencer."}
            </p>
            {canCreate && !searchTerm && statusFilter === "all" && groupFilter === "all" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-secondary hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une livraison
              </Button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fournisseur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groupe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date prévue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commande liée
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé par
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="w-5 h-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {delivery.supplier?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                #{delivery.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: delivery.group?.color }}
                            />
                            <span className="text-sm text-gray-900">{delivery.group?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {format(new Date(delivery.plannedDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-sm">
                            {formatQuantity(delivery.quantity, delivery.unit)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(delivery.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {delivery.order ? (
                            <div className="flex items-center">
                              <Package className="w-4 h-4 text-primary mr-2" />
                              <span>#{delivery.order.id}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Aucune</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            {delivery.creator?.firstName} {delivery.creator?.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDelivery(delivery)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDelivery(delivery)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canValidate && delivery.status !== 'delivered' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleValidateDelivery(delivery.id)}
                                className="text-green-600 hover:text-green-700"
                                disabled={validateMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDelivery(delivery.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
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

      {/* Modals */}
      {showCreateModal && (
        <CreateDeliveryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          selectedDate={null}
        />
      )}

      {showEditModal && selectedDelivery && (
        <EditDeliveryModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          delivery={selectedDelivery}
        />
      )}

      {showDetailModal && selectedDelivery && (
        <OrderDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          item={selectedDelivery}
        />
      )}
    </div>
  );
}
