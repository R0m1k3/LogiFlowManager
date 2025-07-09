import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import type { Group, Supplier, OrderWithRelations } from "@shared/schema";

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export default function CreateDeliveryModal({
  isOpen,
  onClose,
  selectedDate,
}: CreateDeliveryModalProps) {
  const { user } = useAuth();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    orderId: "",
    supplierId: "",
    groupId: "",
    plannedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : "",
    quantity: "",
    unit: "palettes",
    comments: "",
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  const { data: orders = [] } = useQuery<OrderWithRelations[]>({
    queryKey: ['/api/orders'],
  });

  // Auto-sélectionner le magasin selon les règles
  useEffect(() => {
    if (groups.length > 0 && !formData.groupId) {
      let defaultGroupId = "";
      
      if (user?.role === 'admin') {
        // Pour l'admin : utiliser le magasin sélectionné ou le premier si "tous les magasins"
        if (selectedStoreId) {
          defaultGroupId = selectedStoreId.toString();
        } else {
          defaultGroupId = groups[0].id.toString();
        }
      } else {
        // Pour les autres rôles : prendre le premier magasin attribué
        // (La logique existante filtre déjà les groupes selon les permissions)
        defaultGroupId = groups[0].id.toString();
      }
      
      setFormData(prev => ({ ...prev, groupId: defaultGroupId }));
    }
  }, [groups, selectedStoreId, user?.role, formData.groupId]);

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/deliveries", data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Livraison créée avec succès",
      });
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
        description: "Impossible de créer la livraison",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.groupId || !formData.plannedDate || !formData.quantity) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    createDeliveryMutation.mutate({
      orderId: formData.orderId ? parseInt(formData.orderId) : undefined,
      supplierId: parseInt(formData.supplierId),
      groupId: parseInt(formData.groupId),
      plannedDate: formData.plannedDate,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      comments: formData.comments || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter orders that don't have deliveries yet
  const availableOrders = orders.filter(order => 
    order.status !== 'delivered' && (!order.deliveries || order.deliveries.length === 0)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle Livraison</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order">Commande liée (optionnel)</Label>
            <Select value={formData.orderId} onValueChange={(value) => handleChange('orderId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une commande" />
              </SelectTrigger>
              <SelectContent>
                {availableOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    #{order.id} - {order.supplier.name} - {order.quantity}{order.unit === 'palettes' ? 'P' : 'C'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplier">Fournisseur *</Label>
            <Select value={formData.supplierId} onValueChange={(value) => handleChange('supplierId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Afficher le sélecteur seulement pour les admins ou quand il y a plusieurs magasins */}
          {(user?.role === 'admin' && groups.length > 1) ? (
            <div>
              <Label htmlFor="group">Magasin/Groupe *</Label>
              <Select value={formData.groupId} onValueChange={(value) => handleChange('groupId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un groupe" />
                </SelectTrigger>
                <SelectContent>
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
          ) : (
            /* Afficher juste le nom du magasin sélectionné pour les autres rôles */
            formData.groupId && (
              <div>
                <Label>Magasin/Groupe</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                  {(() => {
                    const selectedGroup = groups.find(g => g.id.toString() === formData.groupId);
                    return selectedGroup ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: selectedGroup.color }}
                        />
                        <span className="font-medium">{selectedGroup.name}</span>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )
          )}

          <div>
            <Label htmlFor="plannedDate">Date prévue *</Label>
            <Input
              id="plannedDate"
              type="date"
              value={formData.plannedDate}
              onChange={(e) => handleChange('plannedDate', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unité</Label>
              <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="palettes">Palettes</SelectItem>
                  <SelectItem value="colis">Colis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              placeholder="Commentaires additionnels..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createDeliveryMutation.isPending}
              className="bg-secondary hover:bg-green-700"
            >
              {createDeliveryMutation.isPending ? "Création..." : "Créer la livraison"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
