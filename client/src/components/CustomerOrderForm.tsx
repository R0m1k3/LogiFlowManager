import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertCustomerOrderSchema, type CustomerOrderWithRelations, type Group } from "@shared/schema";

const customerOrderFormSchema = insertCustomerOrderSchema.extend({
  deposit: z.string().optional(),
  gencode: z.string().min(1, "Le gencode est obligatoire"),
});

type CustomerOrderFormData = z.infer<typeof customerOrderFormSchema>;

interface CustomerOrderFormProps {
  order?: CustomerOrderWithRelations;
  onSubmit: (data: CustomerOrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  "En attente de Commande",
  "Commande en Cours", 
  "Disponible",
  "Retiré",
  "Annulé"
];

export function CustomerOrderForm({ 
  order, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CustomerOrderFormProps) {
  const { user } = useAuth();

  // Fetch groups for store selection
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  const form = useForm<CustomerOrderFormData>({
    resolver: zodResolver(customerOrderFormSchema),
    defaultValues: {
      orderTaker: order?.orderTaker || user?.name || "",
      customerName: order?.customerName || "",
      customerPhone: order?.customerPhone || "",
      productDesignation: order?.productDesignation || "",
      productReference: order?.productReference || "",
      gencode: order?.gencode || "",
      status: "En attente de Commande", // Statut fixe
      deposit: order?.deposit ? order.deposit.toString() : "0",
      isPromotionalPrice: order?.isPromotionalPrice || false,
      customerNotified: order?.customerNotified || false,
      groupId: order?.groupId || (user?.userGroups?.[0]?.groupId) || undefined, // Auto-sélection
    },
  });

  const handleSubmit = (data: CustomerOrderFormData) => {
    // Convert deposit string to number
    const submitData = {
      ...data,
      deposit: data.deposit ? parseFloat(data.deposit) : 0,
      groupId: parseInt(data.groupId.toString()),
    };
    onSubmit(submitData);
  };

  // Get available groups for the user
  const availableGroups = user?.role === 'admin' 
    ? groups 
    : user?.userGroups?.map(ug => ug.group) || [];

  // Auto-select group for non-admin users with single group
  if (user?.role !== 'admin' && availableGroups.length === 1 && !form.getValues('groupId')) {
    form.setValue('groupId', availableGroups[0].id);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informations de commande */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations de commande</h3>
            
            <FormField
              control={form.control}
              name="orderTaker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qui a pris la commande</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'employé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du client</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom complet du client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="0X XX XX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Magasin automatiquement sélectionné - pas de champ visible */}
          </div>

          {/* Informations produit */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations produit</h3>
            
            <FormField
              control={form.control}
              name="productDesignation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Désignation du produit</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description détaillée du produit"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="REF-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gencode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gencode (obligatoire)</FormLabel>
                  <FormControl>
                    <Input placeholder="Code à barres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Statut fixé automatiquement à "En attente de Commande" */}
          </div>
        </div>

        {/* Options supplémentaires */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Options supplémentaires</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acompte (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isPromotionalPrice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Prix publicité
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Cocher si le produit était en promotion
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Case "Client appelé" cachée pour nouvelles commandes */}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Enregistrement..." : order ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}