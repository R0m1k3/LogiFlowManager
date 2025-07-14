import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Phone, PhoneCall, Printer, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { CustomerOrderWithRelations, Group } from "@shared/schema";
import { CustomerOrderForm } from "@/components/CustomerOrderForm";
import { CustomerOrderDetails } from "@/components/CustomerOrderDetails";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function CustomerOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch groups for store filter
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Fetch customer orders (no store filtering needed)
  const { data: customerOrders = [], isLoading } = useQuery<CustomerOrderWithRelations[]>({
    queryKey: ['/api/customer-orders'],
    queryFn: () => apiRequest('/api/customer-orders'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/customer-orders', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      setShowCreateModal(false);
      toast({
        title: "Succès",
        description: "Commande client créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/customer-orders/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      setShowEditModal(false);
      setSelectedOrder(null);
      toast({
        title: "Succès",
        description: "Commande client mise à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de la commande",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/customer-orders/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      setShowDeleteModal(false);
      setSelectedOrder(null);
      toast({
        title: "Succès",
        description: "Commande client supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de la commande",
        variant: "destructive",
      });
    },
  });

  // Notification mutation
  const notificationMutation = useMutation({
    mutationFn: ({ id, customerNotified }: { id: number; customerNotified: boolean }) =>
      apiRequest(`/api/customer-orders/${id}`, {
        method: 'PUT',
        body: { customerNotified },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      toast({
        title: "Succès",
        description: "Statut de notification mis à jour",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En attente de Commande":
        return "bg-yellow-100 text-yellow-800";
      case "Commande en Cours":
        return "bg-blue-100 text-blue-800";
      case "Disponible":
        return "bg-green-100 text-green-800";
      case "Retiré":
        return "bg-gray-100 text-gray-800";
      case "Annulé":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isGrayedOut = (status: string) => {
    return status === "Retiré" || status === "Annulé";
  };

  const canShowButtons = (status: string) => {
    return status === "Disponible";
  };

  const handleCreateOrder = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditOrder = (data: any) => {
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, data });
    }
  };

  const openEditModal = (order: CustomerOrderWithRelations) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const openDetailsModal = (order: CustomerOrderWithRelations) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (order: CustomerOrderWithRelations) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleNotificationToggle = (order: CustomerOrderWithRelations) => {
    notificationMutation.mutate({
      id: order.id,
      customerNotified: !order.customerNotified
    });
  };

  const handlePrintLabel = (order: CustomerOrderWithRelations) => {
    // Ouvrir une nouvelle fenêtre pour imprimer l'étiquette
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Étiquette - ${order.customerName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .label { border: 2px solid #000; padding: 15px; width: 400px; }
              .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
              .barcode { text-align: center; font-family: 'Courier New', monospace; font-size: 24px; margin: 10px 0; }
              .details { margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">COMMANDE CLIENT</div>
              <div class="details">
                <strong>Client:</strong> ${order.customerName}<br>
                <strong>Téléphone:</strong> ${order.customerPhone}<br>
                <strong>Produit:</strong> ${order.productDesignation}<br>
                ${order.productReference ? `<strong>Référence:</strong> ${order.productReference}<br>` : ''}
                ${order.gencode ? `<strong>Code barre:</strong><br><div class="barcode">${order.gencode}</div>` : ''}
                <strong>Magasin:</strong> ${order.group.name}<br>
                <strong>Date:</strong> ${format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}
              </div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    }
  };

  // Filter orders based on search term
  const filteredOrders = Array.isArray(customerOrders) ? customerOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.includes(searchTerm) ||
    (order.productReference && order.productReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.gencode && order.gencode.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Commandes Client</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Nom client, produit, téléphone, référence, gencode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Commandes ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Gencode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={isGrayedOut(order.status) ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.customerPhone}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.productDesignation}</div>
                        {order.productReference && (
                          <div className="text-sm text-muted-foreground">
                            Ref: {order.productReference}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {order.gencode || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsModal(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canShowButtons(order.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintLabel(order)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNotificationToggle(order)}
                              className={order.customerNotified ? "bg-green-100" : ""}
                            >
                              {order.customerNotified ? (
                                <PhoneCall className="h-4 w-4" />
                              ) : (
                                <Phone className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {user?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Commande Client</DialogTitle>
          </DialogHeader>
          <CustomerOrderForm
            onSubmit={handleCreateOrder}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <CustomerOrderForm
              order={selectedOrder}
              onSubmit={handleEditOrder}
              onCancel={() => setShowEditModal(false)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <CustomerOrderDetails order={selectedOrder} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={() => selectedOrder && deleteMutation.mutate(selectedOrder.id)}
        title="Supprimer la commande"
        description={`Êtes-vous sûr de vouloir supprimer la commande de ${selectedOrder?.customerName} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}