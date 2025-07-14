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
  DialogDescription,
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch groups for store filter
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Fetch customer orders (no store filtering needed)
  const { data: customerOrders = [], isLoading } = useQuery<CustomerOrderWithRelations[]>({
    queryKey: ['/api/customer-orders'],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/customer-orders', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      // Force refresh of the query
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      queryClient.refetchQueries({ queryKey: ['/api/customer-orders'] });
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

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/customer-orders/${id}`, {
        method: 'PUT',
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-orders'] });
      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour",
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
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "Commande en Cours":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Disponible":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Retiré":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "Annulé":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const isGrayedOut = (status: string) => {
    return status === "Retiré" || status === "Annulé";
  };

  const canShowButtons = (status: string) => {
    return status === "Disponible";
  };

  const statusOptions = [
    "En attente de Commande",
    "Commande en Cours", 
    "Disponible",
    "Retiré",
    "Annulé"
  ];

  const handleStatusChange = (id: number, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus });
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

  const openStatusModal = (order: CustomerOrderWithRelations) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
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
            <title>Commande #${order.id}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                background-color: #f5f5f5;
                margin: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .header { 
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e5e7eb;
              }
              .title {
                font-size: 20px;
                font-weight: bold;
                color: #111827;
              }
              .status-badge {
                background-color: #fef3c7;
                color: #92400e;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .section {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
              }
              .section-title {
                font-size: 16px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .section-content {
                color: #1f2937;
                line-height: 1.6;
              }
              .field-row {
                display: flex;
                margin-bottom: 8px;
              }
              .field-label {
                font-weight: 500;
                color: #374151;
                min-width: 120px;
                margin-right: 8px;
              }
              .field-value {
                color: #111827;
              }
              .reference-code {
                background-color: #f3f4f6;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #374151;
              }
              .quantity-badge {
                background-color: #10b981;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                display: inline-block;
              }
              .barcode-section {
                text-align: center;
                margin: 15px 0;
              }
              .barcode {
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                color: #111827;
                letter-spacing: 2px;
                margin: 10px 0;
              }
              .barcode-number {
                font-size: 14px;
                color: #6b7280;
                margin-top: 5px;
              }
              .store-badge {
                background-color: #dbeafe;
                color: #1e40af;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                display: inline-block;
              }
              .creation-date {
                color: #6b7280;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="title">Commande #${order.id}</div>
                <div class="status-badge">${order.status}</div>
              </div>
              <div class="creation-date">Créée le ${format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })} à ${format(new Date(order.createdAt), 'HH:mm')}</div>
              
              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Informations Client
                </div>
                <div class="section-content">
                  <div class="field-row">
                    <span class="field-label">Nom:</span>
                    <span class="field-value">${order.customerName}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">📞 Téléphone:</span>
                    <span class="field-value">${order.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  Informations Produit
                </div>
                <div class="section-content">
                  <div class="field-row">
                    <span class="field-label">Désignation:</span>
                  </div>
                  <div style="background-color: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                    ${order.productDesignation}
                  </div>
                  ${order.productReference ? `
                  <div class="field-row">
                    <span class="field-label">Référence:</span>
                    <span class="field-value">
                      <span class="reference-code">${order.productReference}</span>
                    </span>
                  </div>` : ''}
                  <div class="field-row">
                    <span class="field-label">Quantité:</span>
                    <span class="field-value">
                      <span class="quantity-badge">${order.quantity || 1}</span>
                    </span>
                  </div>
                  ${order.gencode ? `
                  <div class="field-row">
                    <span class="field-label">Code à barres:</span>
                  </div>
                  <div class="barcode-section">
                    <div class="barcode">|||||||||||||||</div>
                    <div class="barcode-number">${order.gencode}</div>
                  </div>` : ''}
                </div>
              </div>

              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Informations Commande
                </div>
                <div class="section-content">
                  <div class="field-row">
                    <span class="field-label">Prise par:</span>
                    <span class="field-value">${order.orderTaker}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">🏪 Magasin:</span>
                    <span class="field-value">
                      <span class="store-badge">${order.group.name}</span>
                    </span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">📅 Date de création:</span>
                    <span class="field-value">${format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })} à ${format(new Date(order.createdAt), 'HH:mm')}</span>
                  </div>
                </div>
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
                  <TableHead>Quantité</TableHead>
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
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">
                        {order.quantity || 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {order.gencode || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${getStatusColor(order.status)} cursor-pointer hover:opacity-80 transition-opacity rounded-none`}
                        onClick={() => openStatusModal(order)}
                      >
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

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription>
              Sélectionnez un nouveau statut pour cette commande client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Commande: <span className="font-medium">{selectedOrder?.productDesignation}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Client: <span className="font-medium">{selectedOrder?.customerName}</span>
              </p>
            </div>
            
            <div className="grid gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={selectedOrder?.status === status ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    if (selectedOrder) {
                      handleStatusChange(selectedOrder.id, status);
                      setShowStatusModal(false);
                    }
                  }}
                  disabled={statusMutation.isPending}
                >
                  <Badge className={`${getStatusColor(status)} mr-2 rounded-none`}>
                    {status}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
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