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
    .sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
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
        <div className="bg-orange-50 border-2 border-orange-300 p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-semibold text-orange-800">
            <strong>{pendingOrdersCount} commande(s) en attente</strong> nécessitent une planification
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Livraisons ce mois</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{deliveredThisMonth}</p>
              </div>
              <div className="h-14 w-14 bg-green-200 border-2 border-green-400 flex items-center justify-center">
                <Truck className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Commandes en attente</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{pendingOrdersCount}</p>
              </div>
              <div className="h-14 w-14 bg-orange-200 border-2 border-orange-400 flex items-center justify-center">
                <Clock className="h-8 w-8 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Délai moyen (jours)</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{averageDeliveryTime}</p>
              </div>
              <div className="h-14 w-14 bg-blue-200 border-2 border-blue-400 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total palettes</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{totalPalettes}</p>
              </div>
              <div className="h-14 w-14 bg-purple-200 border-2 border-purple-400 flex items-center justify-center">
                <Package className="h-8 w-8 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dernières Commandes */}
        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardHeader className="pb-4 border-b-2 border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center uppercase tracking-wide">
              <FileText className="h-6 w-6 mr-3" />
              Dernières Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-100 border-l-4 border-blue-600">
                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 bg-blue-600"></div>
                  <div>
                    <p className="font-bold text-gray-900">{order.supplier?.name}</p>
                    <p className="text-sm font-medium text-gray-600">{order.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : order.status === 'planned' ? 'secondary' : 'destructive'}
                    className="font-bold uppercase text-xs"
                  >
                    {order.status === 'delivered' ? 'Livrée' : order.status === 'planned' ? 'Planifiée' : 'En attente'}
                  </Badge>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    {format(new Date(order.plannedDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-600 text-center py-8 font-medium">Aucune commande récente</p>
            )}
          </CardContent>
        </Card>

        {/* Livraisons à Venir */}
        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardHeader className="pb-4 border-b-2 border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center uppercase tracking-wide">
              <Calendar className="h-6 w-6 mr-3" />
              Livraisons à Venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((delivery: any) => (
              <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-100 border-l-4 border-green-600">
                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 bg-green-600"></div>
                  <div>
                    <p className="font-bold text-gray-900">{delivery.supplier?.name}</p>
                    <p className="text-sm font-medium text-gray-600">{delivery.group?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">
                    {delivery.quantity} {delivery.unit}
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    {format(new Date(delivery.plannedDate), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-600 text-center py-8 font-medium">Aucune livraison programmée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Rapprochement BL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Statut des livraisons */}
        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardHeader className="pb-4 border-b-2 border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center uppercase tracking-wide">
              <Package className="h-6 w-6 mr-3" />
              Statut des Livraisons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-orange-600 border border-orange-800"></div>
                <span className="text-sm font-bold text-gray-700">En attente</span>
              </div>
              <span className="font-black text-orange-700 text-lg">{allDeliveries.filter((d: any) => d.status === 'planned').length}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-green-600 border border-green-800"></div>
                <span className="text-sm font-bold text-gray-700">Livrées</span>
              </div>
              <span className="font-black text-green-700 text-lg">{allDeliveries.filter((d: any) => d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-blue-600 border border-blue-800"></div>
                <span className="text-sm font-bold text-gray-700">Avec BL validé</span>
              </div>
              <span className="font-black text-blue-700 text-lg">{allDeliveries.filter((d: any) => d.blNumber && d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-gray-300 pt-3 mt-3 p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-600 border border-gray-800"></div>
                <span className="text-sm font-black text-gray-900 uppercase">Total livraisons</span>
              </div>
              <span className="font-black text-xl text-gray-900">{allDeliveries.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statut des commandes */}
        <Card className="bg-white border-2 border-gray-300 shadow-md">
          <CardHeader className="pb-4 border-b-2 border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center uppercase tracking-wide">
              <ShoppingCart className="h-6 w-6 mr-3" />
              Statut des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-red-600 border border-red-800"></div>
                <span className="text-sm font-bold text-gray-700">En attente</span>
              </div>
              <span className="font-black text-red-700 text-lg">{ordersByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-orange-600 border border-orange-800"></div>
                <span className="text-sm font-bold text-gray-700">Planifiées</span>
              </div>
              <span className="font-black text-orange-700 text-lg">{ordersByStatus.planned}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-green-600 border border-green-800"></div>
                <span className="text-sm font-bold text-gray-700">Terminées</span>
              </div>
              <span className="font-black text-green-700 text-lg">{ordersByStatus.delivered}</span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-gray-300 pt-3 mt-3 p-2">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-600 border border-gray-800"></div>
                <span className="text-sm font-black text-gray-900 uppercase">Total commandes</span>
              </div>
              <span className="font-black text-xl text-gray-900">{ordersByStatus.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}