import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Eye, Edit, Trash2, CheckCircle, Package, Clock, AlertCircle, Filter, Download, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuthUnified } from "@/hooks/useAuthUnified";
import { apiRequest } from "@/lib/queryClient";
import type { DlcProductWithRelations, InsertDlcProduct } from "@shared/schema";

const dlcFormSchema = z.object({
  productName: z.string().min(1, "Le nom du produit est obligatoire"),
  gencode: z.string().optional(),
  expiryDate: z.string().min(1, "La date d'expiration est obligatoire"),
  dateType: z.enum(["dlc", "ddm", "dluo"], { required_error: "Le type de date est obligatoire" }),
  supplierId: z.number().min(1, "Le fournisseur est obligatoire"),
  status: z.enum(["en_cours", "expires_soon", "expires", "valides"]).default("en_cours"),
  notes: z.string().optional(),
});

type DlcFormData = z.infer<typeof dlcFormSchema>;

export default function DlcPage() {
  const { user, isLoading: authLoading } = useAuthUnified();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DlcProductWithRelations | null>(null);

  // Fetch stores/groups
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !authLoading,
  });

  // Set default store for non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin' && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]?.id?.toString() || "");
    }
  }, [user, stores, selectedStore]);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    enabled: !authLoading,
  });

  // Fetch DLC products
  const { data: dlcProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/dlc-products", selectedStore, statusFilter, supplierFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStore && selectedStore !== "all") params.append("storeId", selectedStore);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (supplierFilter && supplierFilter !== "all") params.append("supplierId", supplierFilter);
      
      return apiRequest(`/api/dlc-products?${params.toString()}`);
    },
    enabled: !authLoading && (user?.role === 'admin' || selectedStore),
  });

  // Fetch DLC stats
  const { data: stats = { active: 0, expiringSoon: 0, expired: 0 } } = useQuery({
    queryKey: ["/api/dlc-products/stats", selectedStore],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStore && selectedStore !== "all") params.append("storeId", selectedStore);
      return apiRequest(`/api/dlc-products/stats?${params.toString()}`);
    },
    enabled: !authLoading && (user?.role === 'admin' || selectedStore),
  });

  // Form setup
  const form = useForm<DlcFormData>({
    resolver: zodResolver(dlcFormSchema),
    defaultValues: {
      productName: "",
      gencode: "",
      dateType: "dlc",
      status: "en_cours",
      notes: "",
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertDlcProduct) => apiRequest("/api/dlc-products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products/stats"] });
      toast({ title: "Produit DLC créé avec succès" });
      setIsDialogOpen(false);
      form.reset();
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertDlcProduct> }) =>
      apiRequest(`/api/dlc-products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products/stats"] });
      toast({ title: "Produit DLC mis à jour avec succès" });
      setIsDialogOpen(false);
      form.reset();
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/dlc-products/${id}/validate`, {
      method: "PUT",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products/stats"] });
      toast({ title: "Produit validé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la validation",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/dlc-products/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dlc-products/stats"] });
      toast({ title: "Produit supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DlcFormData) => {
    // Calculer la date d'expiration et le seuil d'alerte (15 jours avant)
    const expiryDate = new Date(data.expiryDate);
    
    const dlcData: InsertDlcProduct = {
      ...data,
      expiryDate,
      quantity: 1, // Valeur par défaut
      unit: "unité", // Valeur par défaut
      location: "Magasin", // Valeur par défaut
      alertThreshold: 15, // Toujours 15 jours
      groupId: parseInt(selectedStore) || (user?.role !== 'admin' ? stores[0]?.id : 1),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: dlcData });
    } else {
      createMutation.mutate(dlcData);
    }
  };

  const handleEdit = (product: DlcProductWithRelations) => {
    setEditingProduct(product);
    form.reset({
      productName: product.productName,
      gencode: product.gencode || "",
      expiryDate: format(new Date(product.expiryDate), "yyyy-MM-dd"),
      dateType: product.dateType as "dlc" | "ddm" | "dluo",
      supplierId: product.supplierId,
      status: product.status as "en_cours" | "expires_soon" | "expires" | "valides",
      notes: product.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string, expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "expires" || daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (status === "expires_soon" || daysUntilExpiry <= 15) { // 15 jours au lieu de 3
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Expire bientôt</Badge>;
    } else if (status === "valides") {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Validé</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
    }
  };

  const printExpiringSoon = () => {
    const expiringSoon = filteredProducts.filter(product => {
      const today = new Date();
      const expiry = new Date(product.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 15;
    });

    const printContent = `
      <html>
        <head>
          <title>Produits expirant bientôt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #ff6b35; }
          </style>
        </head>
        <body>
          <h1>Produits expirant dans les 15 prochains jours</h1>
          <p>Date d'impression: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Code EAN13</th>
                <th>Date d'expiration</th>
                <th>Type</th>
                <th>Fournisseur</th>
                <th>Jours restants</th>
              </tr>
            </thead>
            <tbody>
              ${expiringSoon.map(product => {
                const today = new Date();
                const expiry = new Date(product.expiryDate);
                const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td>${product.productName}</td>
                    <td>${product.gencode || '-'}</td>
                    <td>${format(new Date(product.expiryDate), "dd/MM/yyyy")}</td>
                    <td>${product.dateType.toUpperCase()}</td>
                    <td>${product.supplier.name}</td>
                    <td>${diffDays}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printExpired = () => {
    const expired = filteredProducts.filter(product => {
      const today = new Date();
      const expiry = new Date(product.expiryDate);
      return expiry < today;
    });

    const printContent = `
      <html>
        <head>
          <title>Produits expirés</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Produits expirés</h1>
          <p>Date d'impression: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Code EAN13</th>
                <th>Date d'expiration</th>
                <th>Type</th>
                <th>Fournisseur</th>
                <th>Jours dépassés</th>
              </tr>
            </thead>
            <tbody>
              ${expired.map(product => {
                const today = new Date();
                const expiry = new Date(product.expiryDate);
                const diffDays = Math.ceil((today.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td>${product.productName}</td>
                    <td>${product.gencode || '-'}</td>
                    <td>${format(new Date(product.expiryDate), "dd/MM/yyyy")}</td>
                    <td>${product.dateType.toUpperCase()}</td>
                    <td>${product.supplier.name}</td>
                    <td>${diffDays}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredProducts = dlcProducts.filter(product => {
    if (searchTerm) {
      return product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Module DLC</h1>
          <p className="text-muted-foreground">Gestion des dates limites de consommation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printExpiringSoon}>
            <FileText className="w-4 h-4 mr-2" />
            Imprimer expire bientôt
          </Button>
          <Button variant="outline" onClick={printExpired}>
            <FileText className="w-4 h-4 mr-2" />
            Imprimer expirés
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit DLC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit DLC" : "Nouveau produit DLC"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du produit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom du produit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un fournisseur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gencode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code EAN13 (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1234567890123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'expiration</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de date</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dlc">DLC (Date Limite de Consommation)</SelectItem>
                            <SelectItem value="ddm">DDM (Date de Durabilité Minimale)</SelectItem>
                            <SelectItem value="dluo">DLUO (Date Limite d'Utilisation Optimale)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notes ou observations..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingProduct ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_cours">Actifs</SelectItem>
                  <SelectItem value="expires_soon">Expire bientôt</SelectItem>
                  <SelectItem value="expires">Expirés</SelectItem>
                  <SelectItem value="valides">Validés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fournisseur</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les fournisseurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Produits en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expire Bientôt</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Dans les 15 prochains jours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirés</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Nécessitent une action</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Produits DLC ({filteredProducts.length})</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex justify-center items-center h-32">Chargement des produits...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit DLC trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code EAN13</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.gencode || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {product.dateType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(product.expiryDate), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{product.supplier.name}</TableCell>
                      <TableCell>{getStatusBadge(product.status, product.expiryDate)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'manager') && product.status !== 'valides' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => validateMutation.mutate(product.id)}
                              disabled={validateMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}