import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/components/Layout";
import { Link } from "wouter";
import { 
  Calendar,
  Package,
  Truck,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Archive,
  ChevronRight,
  Activity
} from "lucide-react";
import type { OrderWithRelations, DeliveryWithRelations } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedStoreId } = useStore();

  const { data: orders = [] } = useQuery<OrderWithRelations[]>({
    queryKey: ['/api/orders'],
  });

  const { data: deliveries = [] } = useQuery<DeliveryWithRelations[]>({
    queryKey: ['/api/deliveries'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats/monthly'],
    select: (data) => ({
      ordersCount: parseInt(data.ordersCount) || 0,
      deliveriesCount: parseInt(data.deliveriesCount) || 0,
      pendingOrdersCount: parseInt(data.pendingOrdersCount) || 0,
      averageDeliveryTime: parseFloat(data.averageDeliveryTime) || 0,
      totalPalettes: parseInt(data.totalPalettes) || 0,
      totalPackages: parseInt(data.totalPackages) || 0,
    }),
  });

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const quickActions = [
    {
      title: "Nouvelle commande",
      description: "Créer une nouvelle commande",
      icon: Package,
      color: "bg-blue-500",
      href: "/calendar"
    },
    {
      title: "Enregistrer livraison",
      description: "Enregistrer une livraison",
      icon: Truck,
      color: "bg-green-500",
      href: "/calendar"
    },
    {
      title: "Vérifier DLC",
      description: "Vérifier les dates limites",
      icon: Clock,
      color: "bg-orange-500",
      href: "/deliveries"
    },
    {
      title: "Mise à jour",
      description: "Mettre à jour les statuts",
      icon: CheckCircle,
      color: "bg-purple-500",
      href: "/orders"
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header avec salutation */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()} {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Voici un aperçu de vos activités LogiFlow
          </p>
        </div>

        {/* Stats Cards - Design coloré */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Commandes ce mois</CardTitle>
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.ordersCount || 24}</div>
              <p className="text-sm opacity-80">commandes passées</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Livraisons effectuées</CardTitle>
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.deliveriesCount || 8}</div>
              <p className="text-sm opacity-80">livraisons ce mois</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Commandes clients</CardTitle>
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">156</div>
              <p className="text-sm opacity-80">commandes traitées</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Alertes DLC</CardTitle>
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-sm opacity-80">produits bientôt expirés</p>
            </CardContent>
          </Card>
        </div>

        {/* Section principale avec activités et actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activités récentes - 2/3 de largeur */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="w-5 h-5 mr-2 text-blue-500" />
                  Activités récentes
                  <span className="ml-2 text-sm text-gray-500 font-normal">Votre activité LogiFlow</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentOrders.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune activité récente</p>
                      <p className="text-sm">Vos dernières commandes apparaîtront ici</p>
                    </div>
                  ) : (
                    <>
                      {/* Exemple d'activités récentes */}
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Nouvelle commande CMD-2024-001</p>
                              <p className="text-xs text-gray-500">Commande créée avec Fournisseur ABC</p>
                              <p className="text-xs text-gray-400">Il y a 2 heures</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 border-0">En attente</Badge>
                        </div>
                      </div>
                      
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Truck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Livraison LIV-2024-004</p>
                              <p className="text-xs text-gray-500">Réception validée au magasin Frouard</p>
                              <p className="text-xs text-gray-400">Il y a 5 heures</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0">Validée</Badge>
                        </div>
                      </div>

                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Nouveau client Entreprise Durand</p>
                              <p className="text-xs text-gray-500">Première commande enregistrée</p>
                              <p className="text-xs text-gray-400">Hier</p>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 border-0">Nouveau</Badge>
                        </div>
                      </div>

                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Vérifier DLC</p>
                              <p className="text-xs text-gray-500">3 produits arrivent à expiration</p>
                              <p className="text-xs text-gray-400">Aujourd'hui</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides - 1/3 de largeur */}
          <div>
            <Card className="h-full">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Actions rapides
                  <span className="ml-2 text-sm text-gray-500 font-normal">Accès rapide aux fonctions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}