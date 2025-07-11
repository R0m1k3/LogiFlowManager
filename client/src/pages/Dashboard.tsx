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
    .filter((d: any) => d.status === 'planned')
    .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 2);

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

  // Calculer le total réel des palettes
  const totalPalettes = allDeliveries.reduce((total: number, delivery: any) => {
    if (delivery.unit === 'palettes') {
      return total + (delivery.quantity || 0);
    }
    return total;
  }, 0);

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
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 flex items-center space-x-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            <strong>{pendingOrdersCount} commande(s) en attente</strong> nécessitent une planification
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Livraisons ce mois</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{deliveredThisMonth}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes en attente</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingOrdersCount}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Délai moyen (jours)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{averageDeliveryTime}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total palettes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalPalettes}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières Commandes */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="h-5 w-5 mr-3 text-blue-600" />
              Dernières Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-l-3 border-blue-500">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">{order.supplier?.name}</p>
                    <p className="text-sm text-gray-600">{order.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : order.status === 'planned' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {order.status === 'delivered' ? 'Livrée' : order.status === 'planned' ? 'Planifiée' : 'En attente'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(order.plannedDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-600 text-center py-8">Aucune commande récente</p>
            )}
          </CardContent>
        </Card>

        {/* Livraisons à Venir */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-green-600" />
              Livraisons à Venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((delivery: any) => (
              <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-l-3 border-green-500">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">{delivery.supplier?.name}</p>
                    <p className="text-sm text-gray-600">{delivery.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 text-sm">
                    {delivery.quantity} {delivery.unit}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(delivery.scheduledDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-600 text-center py-8">Aucune livraison programmée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Rapprochement BL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des livraisons */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Package className="h-5 w-5 mr-3 text-blue-600" />
              Statut des Livraisons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-orange-500"></div>
                <span className="text-sm font-medium text-gray-700">En attente</span>
              </div>
              <span className="font-semibold text-orange-600 text-lg">{allDeliveries.filter((d: any) => d.status === 'planned').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Livrées</span>
              </div>
              <span className="font-semibold text-green-600 text-lg">{allDeliveries.filter((d: any) => d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">Avec BL validé</span>
              </div>
              <span className="font-semibold text-blue-600 text-lg">{allDeliveries.filter((d: any) => d.blNumber && d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3 p-3">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-gray-500"></div>
                <span className="text-sm font-semibold text-gray-800">Total livraisons</span>
              </div>
              <span className="font-bold text-xl text-gray-800">{allDeliveries.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statut des commandes */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-3 text-green-600" />
              Statut des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">En attente</span>
              </div>
              <span className="font-semibold text-red-600 text-lg">{ordersByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-orange-500"></div>
                <span className="text-sm font-medium text-gray-700">Planifiées</span>
              </div>
              <span className="font-semibold text-orange-600 text-lg">{ordersByStatus.planned}</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Terminées</span>
              </div>
              <span className="font-semibold text-green-600 text-lg">{ordersByStatus.delivered}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3 p-3">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-gray-500"></div>
                <span className="text-sm font-semibold text-gray-800">Total commandes</span>
              </div>
              <span className="font-bold text-xl text-gray-800">{ordersByStatus.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}