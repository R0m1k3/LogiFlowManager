import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, Truck, Edit, Trash2, Check, X } from "lucide-react";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  item,
}: OrderDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOrder = item?.type === 'order';
  const isDelivery = item?.type === 'delivery';

  const validateDeliveryMutation = useMutation({
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
      onClose();
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
      const endpoint = isOrder ? `/api/orders/${id}` : `/api/deliveries/${id}`;
      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: `${isOrder ? 'Commande' : 'Livraison'} supprimée avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      onClose();
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
        description: `Impossible de supprimer la ${isOrder ? 'commande' : 'livraison'}`,
        variant: "destructive",
      });
    },
  });

  const handleValidateDelivery = () => {
    if (item.id) {
      validateDeliveryMutation.mutate(item.id);
    }
  };

  const handleDelete = () => {
    if (item.id) {
      deleteMutation.mutate(item.id);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const canValidate = (user?.role === 'admin' || user?.role === 'manager') && 
                     isDelivery && item.status !== 'delivered';

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

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit === 'palettes' ? 'Palettes' : 'Colis'}`;
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 -m-6 mb-4">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                {isOrder ? (
                  <Package className="w-5 h-5 text-white" />
                ) : (
                  <Truck className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Détails de la {isOrder ? 'Commande' : 'Livraison'}
                </DialogTitle>
                <p className="text-blue-100">
                  #{isOrder ? 'CMD' : 'LIV'}-{item.id}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96">
          {/* Status */}
          <div className="mb-6">
            {getStatusBadge(item.status)}
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fournisseur
                </label>
                <p className="text-gray-900 font-medium">{item.supplier?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date prévue
                </label>
                <p className="text-gray-900">
                  {format(new Date(item.plannedDate), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité
                </label>
                <Badge variant="outline" className="text-sm">
                  {formatQuantity(item.quantity, item.unit)}
                </Badge>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magasin/Groupe
                </label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.group?.color }}
                  />
                  <span className="text-gray-900">{item.group?.name}</span>
                </div>
              </div>
              {item.deliveredDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de livraison
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(item.deliveredDate), 'dd MMMM yyyy, HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créé par
                </label>
                <p className="text-gray-900">
                  {item.creator?.firstName} {item.creator?.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Comments */}
          {item.comments && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaires
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{item.comments}</p>
              </div>
            </div>
          )}

          {/* Linked Items */}
          {isOrder && item.deliveries && item.deliveries.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Livraisons associées
              </label>
              <div className="space-y-2">
                {item.deliveries.map((delivery: any) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-4 h-4 text-secondary" />
                      <div>
                        <p className="font-medium text-gray-900">#LIV-{delivery.id}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(delivery.plannedDate), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(delivery.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isDelivery && item.order && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Commande associée
              </label>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Package className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">#CMD-{item.order.id}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(item.order.plannedDate), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(item.order.status)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-4 -m-6 mt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {canEdit && (
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
            {canValidate && (
              <Button
                onClick={handleValidateDelivery}
                disabled={validateDeliveryMutation.isPending}
                className="bg-secondary hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Valider livraison
              </Button>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer cette {isOrder ? 'commande' : 'livraison'} ? 
                Cette action est irréversible.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
