import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone, Package, User, Store, Calendar, CreditCard, Tag } from "lucide-react";
import type { CustomerOrderWithRelations } from "@shared/schema";

interface CustomerOrderDetailsProps {
  order: CustomerOrderWithRelations;
}

export function CustomerOrderDetails({ order }: CustomerOrderDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En attente de Commande":
        return "bg-yellow-100 text-yellow-800";
      case "Commande en Cours":
        return "bg-blue-100 text-blue-800";
      case "Disponible":
        return "bg-green-100 text-green-800";
      case "Retiré":
        return "bg-gray-100 text-gray-800";
      case "Annulé":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Générer le code-barres simple (représentation textuelle)
  const renderBarcode = (gencode: string) => {
    return (
      <div className="font-mono text-center border-2 border-dashed p-4 bg-gray-50">
        <div className="text-2xl tracking-widest font-bold mb-2">
          {gencode.split('').map((char, index) => (
            <span key={index} className="inline-block border-l-2 border-black h-8 w-1 mr-1"></span>
          ))}
        </div>
        <div className="text-sm">{gencode}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Commande #{order.id}</h3>
          <p className="text-sm text-muted-foreground">
            Créée le {format(new Date(order.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      <Separator />

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Nom:</span>
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="font-medium">Téléphone:</span>
            <span>{order.customerPhone}</span>
          </div>
          {order.customerNotified && order.status === 'Disponible' && (
            <div className="flex items-center gap-2 text-green-600">
              <Phone className="h-4 w-4" />
              <span className="text-sm">Client notifié de la disponibilité</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations produit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informations Produit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-medium">Désignation:</span>
            <p className="mt-1 text-sm bg-gray-50 p-3 rounded">
              {order.productDesignation}
            </p>
          </div>
          
          {order.productReference && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Référence:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {order.productReference}
              </code>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-medium">Quantité:</span>
            <Badge variant="secondary" className="font-mono">
              {order.quantity || 1}
            </Badge>
          </div>

          {order.gencode && (
            <div>
              <span className="font-medium">Code à barres:</span>
              <div className="mt-2">
                {renderBarcode(order.gencode)}
              </div>
            </div>
          )}

          {order.isPromotionalPrice && (
            <div className="flex items-center gap-2 text-orange-600">
              <Tag className="h-4 w-4" />
              <span className="text-sm font-medium">Prix publicité appliqué</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations commande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations Commande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Prise par:</span>
            <span>{order.orderTaker}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="font-medium">Magasin:</span>
            <Badge
              style={{ 
                backgroundColor: order.group.color + "20", 
                color: order.group.color,
                border: `1px solid ${order.group.color}30`
              }}
            >
              {order.group.name}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Date de création:</span>
            <span>{format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
          </div>

          {order.updatedAt && order.updatedAt !== order.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Dernière modification:</span>
              <span>{format(new Date(order.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
            </div>
          )}

          {order.deposit && parseFloat(order.deposit) > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Acompte:</span>
              <span className="font-mono">{parseFloat(order.deposit).toFixed(2)} €</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions disponibles selon le statut */}
      {order.status === 'Disponible' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Actions disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-green-700">
              <p>• Étiquette imprimable disponible</p>
              <p>• Notification client possible</p>
              <p>• Prêt pour retrait en magasin</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(order.status === 'Retiré' || order.status === 'Annulé') && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-600">Commande terminée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {order.status === 'Retiré' 
                ? 'Cette commande a été retirée par le client.'
                : 'Cette commande a été annulée.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}