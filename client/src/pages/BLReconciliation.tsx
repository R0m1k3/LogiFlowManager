import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useStore } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Search, Plus, Edit, FileText, Euro, Calendar, Building2, CheckCircle, X, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { DayPicker } from "react-day-picker";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const invoiceSchema = z.object({
  invoiceReference: z.string().min(1, "La référence facture est obligatoire"),
  invoiceAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Le montant doit être un nombre positif",
  }),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function BLReconciliation() {
  const { user } = useAuth();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Redirection pour les employés
  if (user?.role === 'employee') {
    return (
      <div className="p-6">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Accès restreint</strong><br />
                Seuls les managers et administrateurs peuvent accéder au module de rapprochement BL/Factures.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<any>(null);

  // Récupérer les livraisons validées avec BL
  const { data: deliveriesWithBL = [], isLoading } = useQuery({
    queryKey: ['/api/deliveries/bl', selectedStoreId, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        withBL: 'true'
      });
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      // Ajouter filtre par date si sélectionné
      if (selectedDate) {
        const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
        params.append('startDate', dateStr);
        params.append('endDate', dateStr);
      }
      
      const response = await fetch(`/api/deliveries?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      const deliveries = await response.json();
      console.log('All deliveries received:', deliveries);
      const filtered = deliveries.filter((d: any) => d.blNumber && d.status === 'delivered');
      console.log('Filtered deliveries for BL reconciliation:', filtered);
      return filtered.sort((a: any, b: any) => new Date(b.deliveredDate).getTime() - new Date(a.deliveredDate).getTime());
    },
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceReference: "",
      invoiceAmount: "",
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { id: number; invoiceReference: string; invoiceAmount: string }) => {
      console.log('🔄 Updating invoice data:', data);
      const response = await apiRequest("PUT", `/api/deliveries/${data.id}`, {
        invoiceReference: data.invoiceReference,
        invoiceAmount: data.invoiceAmount,
      });
      console.log('✅ Invoice update response:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Facture associée avec succès",
      });
      // Invalider tous les caches BL/Rapprochement avec toutes les variations de clés
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
      form.reset();
      setShowInvoiceModal(false);
      setSelectedDelivery(null);
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
        description: "Impossible d'associer la facture",
        variant: "destructive",
      });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/deliveries/${id}`, {
        reconciled: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Rapprochement validé avec succès",
      });
      // Invalider tous les caches BL/Rapprochement
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
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
        description: "Impossible de valider le rapprochement",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/deliveries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Livraison supprimée avec succès",
      });
      // Invalider tous les caches BL/Rapprochement
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/deliveries/bl' || 
          query.queryKey[0] === '/api/deliveries'
      });
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

  const handleDeleteDelivery = (delivery: any) => {
    setDeliveryToDelete(delivery);
    setShowDeleteModal(true);
  };

  const confirmDeleteDelivery = () => {
    if (deliveryToDelete) {
      deleteDeliveryMutation.mutate(deliveryToDelete.id);
      setShowDeleteModal(false);
      setDeliveryToDelete(null);
    }
  };

  const handleAddInvoice = (delivery: any) => {
    setSelectedDelivery(delivery);
    form.reset({
      invoiceReference: delivery.invoiceReference || "",
      invoiceAmount: delivery.invoiceAmount || "",
    });
    setShowInvoiceModal(true);
  };

  const onSubmit = (data: InvoiceForm) => {
    if (selectedDelivery) {
      updateInvoiceMutation.mutate({
        id: selectedDelivery.id,
        invoiceReference: data.invoiceReference,
        invoiceAmount: data.invoiceAmount, // Envoyer comme string
      });
    }
  };

  const calculateDifference = (blAmount: number, invoiceAmount?: number) => {
    if (!invoiceAmount) return null;
    return blAmount - invoiceAmount;
  };

  const getStatusBadge = (delivery: any) => {
    if (delivery.reconciled) {
      return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
    }
    if (delivery.invoiceReference && delivery.invoiceAmount) {
      return <Badge className="bg-blue-100 text-blue-800">Prêt à valider</Badge>;
    }
    if (delivery.invoiceReference) {
      return <Badge className="bg-yellow-100 text-yellow-800">Facture partielle</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
  };

  const canValidate = (delivery: any) => {
    return delivery.invoiceReference && delivery.invoiceAmount && !delivery.reconciled;
  };

  const handleValidateReconciliation = (delivery: any) => {
    reconcileMutation.mutate(delivery.id);
  };

  const filteredDeliveries = deliveriesWithBL.filter((delivery: any) => {
    if (!searchTerm) return true;
    return (
      delivery.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.blNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.invoiceReference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <FileText className="w-6 h-6 mr-3 text-blue-600" />
              Rapprochement
            </h2>
            <p className="text-gray-600 mt-1">
              Rapprochement des bons de livraison et factures
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm border border-gray-300">
              {filteredDeliveries.length} bon(s) de livraison
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par fournisseur, BL ou facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-gray-300 shadow-sm"
            />
          </div>
          
          {/* Sélecteur de date */}
          <div className="flex items-center space-x-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal border border-gray-300 shadow-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDate(selectedDate, "d MMMM yyyy", { locale: fr }) : "Filtrer par date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsDatePickerOpen(false);
                  }}
                  locale={fr}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
            
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="h-9 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun BL trouvé
            </h3>
            <p className="text-gray-600">
              Les livraisons validées avec numéro de BL apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Bon de Livraison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Livraison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Validation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant BL (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Facture (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Écart (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Magasin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((delivery: any) => {
                  const difference = calculateDifference(
                    parseFloat(delivery.blAmount || '0'),
                    delivery.invoiceAmount ? parseFloat(delivery.invoiceAmount) : undefined
                  );
                  
                  return (
                    <tr 
                      key={delivery.id} 
                      className={`hover:bg-gray-50 ${delivery.reconciled ? 'bg-gray-100 text-gray-600' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.supplier?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.blNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(delivery.scheduledDate), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.reconciled && delivery.updatedAt ? 
                            format(new Date(delivery.updatedAt), 'dd/MM/yyyy', { locale: fr }) : 
                            '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {parseFloat(delivery.blAmount || '0').toFixed(2)} €
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.invoiceReference || (
                            <button
                              onClick={() => handleAddInvoice(delivery)}
                              disabled={updateInvoiceMutation.isPending}
                              className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-7 h-7 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Ajouter une référence facture"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.invoiceAmount ? 
                            `${parseFloat(delivery.invoiceAmount).toFixed(2)} €` : 
                            <button
                              onClick={() => handleAddInvoice(delivery)}
                              disabled={updateInvoiceMutation.isPending}
                              className="text-gray-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-7 h-7 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Ajouter un montant facture"
                            >
                              <Euro className="w-3.5 h-3.5" />
                            </button>
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          difference === null ? 'text-gray-400' :
                          difference === 0 ? 'text-green-600' :
                          difference > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {difference === null ? '-' : `${difference.toFixed(2)} €`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: delivery.group?.color }}
                          />
                          <span className="text-sm text-gray-900">{delivery.group?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {getStatusBadge(delivery)}
                          {!delivery.reconciled && (
                            <>
                              {(delivery.invoiceReference || delivery.invoiceAmount) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddInvoice(delivery)}
                                  disabled={updateInvoiceMutation.isPending}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Modifier
                                </Button>
                              )}
                              {canValidate(delivery) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleValidateReconciliation(delivery)}
                                  disabled={reconcileMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Valider
                                </Button>
                              )}
                            </>
                          )}
                          {user?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDelivery(delivery)}
                              disabled={deleteDeliveryMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-md" aria-describedby="invoice-modal-description">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-primary" />
              <span>
                {selectedDelivery?.invoiceReference ? 'Modifier' : 'Ajouter'} la facture
              </span>
            </DialogTitle>
            <p id="invoice-modal-description" className="text-sm text-gray-600 mt-1">
              Saisir les informations de la facture pour le rapprochement
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Informations BL */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Bon de livraison</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>N° BL:</strong> {selectedDelivery?.blNumber}</p>
                  <p><strong>Montant BL:</strong> {selectedDelivery?.blAmount} €</p>
                  <p><strong>Fournisseur:</strong> {selectedDelivery?.supplier?.name}</p>
                </div>
              </div>

              {/* Référence facture */}
              <FormField
                control={form.control}
                name="invoiceReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence Facture *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: FAC-2024-001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Montant facture */}
              <FormField
                control={form.control}
                name="invoiceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant Facture (€) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1250.50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Aperçu de l'écart */}
              {form.watch("invoiceAmount") && selectedDelivery?.blAmount && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-gray-900">Aperçu de l'écart</h4>
                  <div className="text-sm">
                    <p><strong>Montant BL:</strong> {parseFloat(selectedDelivery.blAmount).toFixed(2)} €</p>
                    <p><strong>Montant Facture:</strong> {parseFloat(form.watch("invoiceAmount") || "0").toFixed(2)} €</p>
                    <p className={`font-medium ${
                      Math.abs(parseFloat(selectedDelivery.blAmount) - parseFloat(form.watch("invoiceAmount") || "0")) < 0.01 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <strong>Écart:</strong> {(parseFloat(selectedDelivery.blAmount) - parseFloat(form.watch("invoiceAmount") || "0")).toFixed(2)} €
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInvoiceModal(false)}
                  disabled={updateInvoiceMutation.isPending}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={updateInvoiceMutation.isPending}
                >
                  {updateInvoiceMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeliveryToDelete(null);
        }}
        onConfirm={confirmDeleteDelivery}
        title="Supprimer la livraison"
        description="Êtes-vous sûr de vouloir supprimer cette livraison du module rapprochement ?"
        itemName={deliveryToDelete ? `${deliveryToDelete.supplier?.name} - BL ${deliveryToDelete.blNumber}` : undefined}
        isLoading={deleteDeliveryMutation.isPending}
      />
    </div>
  );
}