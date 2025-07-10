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
import { Search, Plus, Edit, FileText, Euro, Calendar, Building2 } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Récupérer les livraisons validées avec BL
  const { data: deliveriesWithBL = [], isLoading } = useQuery({
    queryKey: ['/api/deliveries/bl', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams({
        withBL: 'true'
      });
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const response = await fetch(`/api/deliveries?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      const deliveries = await response.json();
      return deliveries.filter((d: any) => d.blNumber && d.status === 'delivered');
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
    mutationFn: async (data: { id: number; invoiceReference: string; invoiceAmount: number }) => {
      await apiRequest("PUT", `/api/deliveries/${data.id}`, {
        invoiceReference: data.invoiceReference,
        invoiceAmount: data.invoiceAmount,
        reconciled: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Facture associée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/bl'] });
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
        invoiceAmount: parseFloat(data.invoiceAmount),
      });
    }
  };

  const calculateDifference = (blAmount: number, invoiceAmount?: number) => {
    if (!invoiceAmount) return null;
    return blAmount - invoiceAmount;
  };

  const getStatusBadge = (delivery: any) => {
    if (delivery.reconciled) {
      return <Badge className="bg-green-100 text-green-800">Rapproché</Badge>;
    }
    if (delivery.invoiceReference) {
      return <Badge className="bg-yellow-100 text-yellow-800">Facture saisie</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
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
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-primary" />
              Rapprochement
            </h2>
            <p className="text-gray-600 mt-1">
              Rapprochement des bons de livraison et factures
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {filteredDeliveries.length} bon(s) de livraison
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par fournisseur, BL ou facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Bon de Livraison
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
                    <tr key={delivery.id} className="hover:bg-gray-50">
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
                          {delivery.deliveredDate ? 
                            format(new Date(delivery.deliveredDate), 'dd/MM/yyyy', { locale: fr }) : 
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
                            <span className="text-gray-400">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {delivery.invoiceAmount ? 
                            `${parseFloat(delivery.invoiceAmount).toFixed(2)} €` : 
                            <span className="text-gray-400">-</span>
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
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(delivery)}
                          {!delivery.reconciled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddInvoice(delivery)}
                              className="ml-2"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              {delivery.invoiceReference ? 'Modifier' : 'Ajouter'} facture
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-primary" />
              <span>
                {selectedDelivery?.invoiceReference ? 'Modifier' : 'Ajouter'} la facture
              </span>
            </DialogTitle>
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
    </div>
  );
}