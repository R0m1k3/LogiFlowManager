import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Truck, 
  Clock, 
  TrendingUp, 
  Users, 
  Building,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/monthly', { year, month }],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries'],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
  });

  const isLoading = statsLoading || ordersLoading || deliveriesLoading;

  // Calculate performance data
  const supplierData = suppliers.map(supplier => {
    const supplierOrders = orders.filter(order => order.supplierId === supplier.id);
    const supplierDeliveries = deliveries.filter(delivery => delivery.supplierId === supplier.id);
    
    return {
      name: supplier.name,
      orders: supplierOrders.length,
      deliveries: supplierDeliveries.length,
      delivered: supplierDeliveries.filter(d => d.status === 'delivered').length,
    };
  }).filter(s => s.orders > 0 || s.deliveries > 0);

  const groupData = groups.map(group => {
    const groupOrders = orders.filter(order => order.groupId === group.id);
    const groupDeliveries = deliveries.filter(delivery => delivery.groupId === group.id);
    
    return {
      name: group.name,
      orders: groupOrders.length,
      deliveries: groupDeliveries.length,
      color: group.color,
    };
  }).filter(g => g.orders > 0 || g.deliveries > 0);

  const statusData = [
    { name: 'En attente', value: orders.filter(o => o.status === 'pending').length, color: '#FF6F00' },
    { name: 'Planifié', value: orders.filter(o => o.status === 'planned').length, color: '#1976D2' },
    { name: 'Livré', value: orders.filter(o => o.status === 'delivered').length, color: '#388E3C' },
  ];

  // Get last 6 months data for trend
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.plannedDate);
      return orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear();
    });
    const monthDeliveries = deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.plannedDate);
      return deliveryDate.getMonth() === d.getMonth() && deliveryDate.getFullYear() === d.getFullYear();
    });
    
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      orders: monthOrders.length,
      deliveries: monthDeliveries.length,
    };
  }).reverse();

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const overdueDeliveries = deliveries.filter(delivery => {
    const plannedDate = new Date(delivery.plannedDate);
    const today = new Date();
    return plannedDate < today && delivery.status !== 'delivered';
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tableau de Bord
            </h2>
            <p className="text-gray-600">
              Vue d'ensemble des activités logistiques
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes ce mois</CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats?.ordersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingOrdersCount || 0} en attente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Livraisons ce mois</CardTitle>
                  <Truck className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats?.deliveriesCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {overdueDeliveries.length} en retard
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Palettes traitées</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats?.totalPalettes || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalPackages || 0} colis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
                  <Clock className="h-4 w-4 text-delivered" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-delivered">
                    {stats?.averageDeliveryTime?.toFixed(1) || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">jours</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supplier Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2 text-primary" />
                    Performance par Fournisseur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supplierData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(207, 90%, 54%)" name="Commandes" />
                      <Bar dataKey="deliveries" fill="hsl(120, 61%, 34%)" name="Livraisons" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                    Répartition des Statuts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Trend and Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Tendance sur 6 mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="hsl(207, 90%, 54%)" strokeWidth={2} name="Commandes" />
                      <Line type="monotone" dataKey="deliveries" stroke="hsl(120, 61%, 34%)" strokeWidth={2} name="Livraisons" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Group Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-secondary" />
                    Répartition par Magasin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(207, 90%, 54%)" name="Commandes" />
                      <Bar dataKey="deliveries" fill="hsl(120, 61%, 34%)" name="Livraisons" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-accent" />
                    Commandes en Attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aucune commande en attente
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {pendingOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.supplier?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.quantity} {order.unit === 'palettes' ? 'palettes' : 'colis'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(order.plannedDate).toLocaleDateString('fr-FR')}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: order.group?.color }}
                              />
                              <span className="text-xs text-gray-500">{order.group?.name}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {pendingOrders.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          Et {pendingOrders.length - 5} autres...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overdue Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
                    Livraisons en Retard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overdueDeliveries.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Aucune livraison en retard
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {overdueDeliveries.slice(0, 5).map((delivery) => (
                        <div key={delivery.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {delivery.supplier?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.quantity} {delivery.unit === 'palettes' ? 'palettes' : 'colis'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">
                              {new Date(delivery.plannedDate).toLocaleDateString('fr-FR')}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: delivery.group?.color }}
                              />
                              <span className="text-xs text-gray-500">{delivery.group?.name}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {overdueDeliveries.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          Et {overdueDeliveries.length - 5} autres...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
