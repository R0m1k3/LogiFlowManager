import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, ShoppingCart, TrendingUp, Clock, MapPin, User, AlertTriangle, CheckCircle, Truck, FileText, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedStoreId } = useStore();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats/monthly', selectedStoreId],
    queryFn: async () => {
      const currentDate = new Date();
      const params = new URLSearchParams({
        year: currentDate.getFullYear().toString(),
        month: (currentDate.getMonth() + 1).toString(),
      });
      
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const response = await fetch(`/api/stats/monthly?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      return response.json();
    },
  });

  // Construire les URLs pour récupérer toutes les données (pas de filtrage par date)
  const ordersUrl = `/api/orders${selectedStoreId && user?.role === 'admin' ? `?storeId=${selectedStoreId}` : ''}`;
  const deliveriesUrl = `/api/deliveries${selectedStoreId && user?.role === 'admin' ? `?storeId=${selectedStoreId}` : ''}`;

  // Utiliser les mêmes clés de cache que les autres pages pour assurer la cohérence
  const { data: allOrders = [] } = useQuery({
    queryKey: [ordersUrl, selectedStoreId],
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: [deliveriesUrl, selectedStoreId],
  });

  // Données dérivées pour les sections
  const recentOrders = allOrders
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  const upcomingDeliveries = allDeliveries
    .filter((d: any) => d.status === 'pending')
    .sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
    .slice(0, 2);

  // Log temporaire pour diagnostic
  console.log('Dashboard data:', {
    totalOrders: allOrders.length,
    totalDeliveries: allDeliveries.length,
    recentOrdersCount: recentOrders.length,
    upcomingDeliveriesCount: upcomingDeliveries.length,
    allOrders: allOrders.map(o => ({ id: o.id, supplier: o.supplier?.name, createdAt: o.createdAt })),
    allDeliveries: allDeliveries.map(d => ({ id: d.id, supplier: d.supplier?.name, status: d.status, plannedDate: d.plannedDate }))
  });

  // Calculs pour les statistiques
  const pendingOrdersCount = allOrders.filter((order: any) => order.status === 'pending').length;
  const averageDeliveryTime = Math.round(stats?.averageDeliveryTime || 2);
  const deliveredThisMonth = allDeliveries.filter((delivery: any) => {
    const deliveryDate = new Date(delivery.deliveredDate || delivery.createdAt);
    const now = new Date();
    return deliveryDate.getMonth() === now.getMonth() && 
           deliveryDate.getFullYear() === now.getFullYear() && 
           delivery.status === 'delivered';
  }).length;

  // Statistiques pour les commandes clients
  const ordersByStatus = {
    pending: allOrders.filter((o: any) => o.status === 'pending').length,
    planned: allOrders.filter((o: any) => o.status === 'planned').length,
    delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
    total: allOrders.length
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble des performances et statistiques</p>
        </div>
      </div>

      {/* Alert */}
      {pendingOrdersCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-orange-700">
            <strong>{pendingOrdersCount} commande(s) en attente</strong> nécessitent une planification
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Livraisons ce mois</p>
                <p className="text-3xl font-bold text-gray-900">{deliveredThisMonth}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes en attente</p>
                <p className="text-3xl font-bold text-gray-900">{pendingOrdersCount}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Délai moyen (jours)</p>
                <p className="text-3xl font-bold text-gray-900">{averageDeliveryTime}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total palettes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalPalettes || 115}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières Commandes */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dernières Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{order.supplier?.name}</p>
                    <p className="text-sm text-gray-600">{order.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'planned' ? 'secondary' : 'destructive'}>
                    {order.status === 'delivered' ? 'Livrée' : order.status === 'planned' ? 'Planifiée' : 'En attente'}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.plannedDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Aucune commande récente</p>
            )}
          </CardContent>
        </Card>

        {/* Livraisons à Venir */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Livraisons à Venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((delivery: any) => (
              <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{delivery.supplier?.name}</p>
                    <p className="text-sm text-gray-600">{delivery.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    17 palettes
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(delivery.plannedDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Aucune livraison programmée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Rapprochement BL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des livraisons */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Statut des Livraisons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En attente</span>
              </div>
              <span className="font-medium text-orange-600">{allDeliveries.filter((d: any) => d.status === 'pending').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Livrées</span>
              </div>
              <span className="font-medium text-green-600">{allDeliveries.filter((d: any) => d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Avec BL validé</span>
              </div>
              <span className="font-medium text-blue-600">{allDeliveries.filter((d: any) => d.blNumber && d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Total livraisons</span>
              </div>
              <span className="font-bold">{allDeliveries.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statut des commandes */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Statut des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En attente</span>
              </div>
              <span className="font-medium text-red-600">{ordersByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Planifiées</span>
              </div>
              <span className="font-medium text-orange-600">{ordersByStatus.planned}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Terminées</span>
              </div>
              <span className="font-medium text-green-600">{ordersByStatus.delivered}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Total commandes</span>
              </div>
              <span className="font-bold">{ordersByStatus.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}