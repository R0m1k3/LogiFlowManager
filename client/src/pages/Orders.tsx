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
  Package, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Building,
  User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CreateOrderModal from "@/components/modals/CreateOrderModal";
import EditOrderModal from "@/components/modals/EditOrderModal";
import OrderDetailModal from "@/components/modals/OrderDetailModal";
import type { OrderWithRelations } from "@shared/schema";

export default function Orders() {
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
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);

  const { data: orders = [], isLoading } = useQuery<OrderWithRelations[]>({
    queryKey: ['/api/orders', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      const result = await apiRequest("GET", `/api/orders?${params.toString()}`);
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
      });
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
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.group?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.comments?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesGroup = groupFilter === "all" || order.groupId.toString() === groupFilter;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Livré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewOrder = (order: OrderWithRelations) => {
    setSelectedOrder({ ...order, type: 'order' });
    setShowDetailModal(true);
  };

  const handleEditOrder = (order: OrderWithRelations) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteOrder = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = true; // All users can create orders
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="w-6 h-6 mr-2 text-primary" />
              Gestion des Commandes
            </h2>
            <p className="text-gray-600">
              {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Commande
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
              <SelectItem value="pending">En attente</SelectItem>
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

      {/* Orders List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Aucune commande trouvée</h3>
            <p className="text-center max-w-md">
              {searchTerm || statusFilter !== "all" || groupFilter !== "all" 
                ? "Aucune commande ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore de commandes. Créez votre première commande pour commencer."}
            </p>
            {canCreate && !searchTerm && statusFilter === "all" && groupFilter === "all" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-primary hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une commande
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
                        Statut
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
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="w-5 h-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.supplier?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                #{order.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: order.group?.color }}
                            />
                            <span className="text-sm text-gray-900">{order.group?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {format(new Date(order.plannedDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            {order.creator?.firstName} {order.creator?.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOrder(order.id)}
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
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          selectedDate={null}
        />
      )}

      {showEditModal && selectedOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={selectedOrder}
        />
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          item={selectedOrder}
        />
      )}
    </div>
  );
}
