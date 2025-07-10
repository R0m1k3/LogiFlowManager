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

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['/api/orders/recent', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const orders = await response.json();
      return orders.slice(0, 3);
    },
  });

  const { data: upcomingDeliveries = [] } = useQuery({
    queryKey: ['/api/deliveries/upcoming', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
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
      return deliveries
        .filter((d: any) => d.status === 'pending')
        .slice(0, 2);
    },
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['/api/orders/all', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return response.json();
    },
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['/api/deliveries/all', selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStoreId && user?.role === 'admin') {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const response = await fetch(`/api/deliveries?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      return response.json();
    },
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">
            <strong>{pendingOrdersCount} ticket(s) SAV urgent(s)</strong> nécessitent une attention immédiate
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
                    {order.status === 'delivered' ? 'Livrée' : order.status === 'planned' ? 'En attente' : 'Livrée'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    1 palettes
                  </p>
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Derniers Tickets SAV */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Derniers Tickets SAV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Michael SCHAL</p>
                  <p className="text-sm text-gray-600">Brisque</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Moyenne
                </Badge>
                <p className="text-xs text-gray-500 mt-1">04 juil.</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Michael SCHAL</p>
                  <p className="text-sm text-gray-600">Brisque</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive">
                  Urgent
                </Badge>
                <p className="text-xs text-gray-500 mt-1">04 juil.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prochaine Pub */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Prochaine Pub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">TRUC</p>
                  <p className="text-sm text-gray-600">Pub n°2029</p>
                </div>
              </div>
              <div className="text-right mt-2">
                <p className="text-sm font-medium text-gray-900">13 juil.</p>
                <p className="text-xs text-gray-500">Année 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tâches à faire */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Tâches à faire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Aucune tâche à faire</p>
              <p className="text-sm text-gray-600">Toutes vos tâches sont terminées !</p>
            </div>
          </CardContent>
        </Card>

        {/* Commandes Clients */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Commandes Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En attente</span>
              </div>
              <span className="font-medium">{ordersByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En commande</span>
              </div>
              <span className="font-medium">{ordersByStatus.planned}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Disponible</span>
              </div>
              <span className="font-medium">{ordersByStatus.delivered}</span>
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

      {/* Gestion DLC Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Gestion DLC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">DLC dépassées</span>
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Expirent bientôt</span>
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">En cours</span>
              </div>
              <span className="font-medium text-blue-600">{allDeliveries.filter((d: any) => d.status === 'pending').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Produits validés</span>
              </div>
              <span className="font-medium text-green-600">{allDeliveries.filter((d: any) => d.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Total produits DLC</span>
              </div>
              <span className="font-bold">{allDeliveries.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}