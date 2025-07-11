import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderWithRelations, DeliveryWithRelations } from "@shared/schema";

interface CalendarGridProps {
  currentDate: Date;
  orders: OrderWithRelations[];
  deliveries: DeliveryWithRelations[];
  onDateClick: (date: Date) => void;
  onItemClick: (item: any, type: 'order' | 'delivery') => void;
}

export default function CalendarGrid({
  currentDate,
  orders,
  deliveries,
  onDateClick,
  onItemClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get all days in the month
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Pad the calendar to start on Monday
  const firstDayOfWeek = monthStart.getDay();
  const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const paddedDays = [];

  // Add padding days from previous month
  for (let i = startPadding; i > 0; i--) {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - i);
    paddedDays.push(paddingDate);
  }

  // Add current month days
  paddedDays.push(...monthDays);

  // Add padding days from next month to complete the grid
  const remainingCells = 42 - paddedDays.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const paddingDate = new Date(monthEnd);
    paddingDate.setDate(paddingDate.getDate() + i);
    paddedDays.push(paddingDate);
  }

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getItemsForDate = (date: Date) => {
    const dayOrders = orders.filter(order => 
      isSameDay(new Date(order.plannedDate), date)
    );
    const dayDeliveries = deliveries.filter(delivery => 
      isSameDay(new Date(delivery.scheduledDate), date)
    );
    
    return { orders: dayOrders, deliveries: dayDeliveries };
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity}${unit === 'palettes' ? 'P' : 'C'}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map(day => (
          <div key={day} className="p-4 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {paddedDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const { orders: dayOrders, deliveries: dayDeliveries } = getItemsForDate(date);
          
          return (
            <div
              key={index}
              className={`h-32 border-r border-b border-gray-100 relative group cursor-pointer transition-colors ${
                isTodayDate
                  ? "bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
                  : isCurrentMonth
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-50"
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="p-2">
                <span className={`text-sm font-medium ${
                  isTodayDate 
                    ? "text-blue-700 font-semibold" 
                    : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                }`}>
                  {format(date, 'd')}
                </span>
                
                {/* Orders and Deliveries */}
                <div className="mt-1 space-y-1">
                  {dayOrders.map((order) => {
                    // Vérifier si la commande a une livraison liée (peu importe le statut)
                    const hasLinkedDelivery = order.deliveries && order.deliveries.length > 0;
                    
                    const colorClass = order.status === 'delivered' 
                      ? 'bg-delivered text-white' 
                      : order.status === 'planned'
                      ? 'bg-orange-500 text-white border-2 border-orange-300'
                      : 'bg-primary text-white';
                    
                    return (
                      <div
                        key={`order-${order.id}`}
                        className={`text-xs px-2 py-1 rounded flex items-center justify-between cursor-pointer ${colorClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(order, 'order');
                        }}
                      >
                        <span className="truncate">
                          {order.supplier.name}
                        </span>
                        <div className="flex items-center ml-1 flex-shrink-0">
                          {order.status === 'planned' && (
                            <span className="w-2 h-2 bg-yellow-300 rounded-full mr-1" title="Commande planifiée (liée à une livraison)" />
                          )}
                          {order.status === 'delivered' && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayDeliveries.map((delivery) => (
                    <div
                      key={`delivery-${delivery.id}`}
                      className={`text-xs px-2 py-1 rounded flex items-center justify-between cursor-pointer ${
                        delivery.status === 'delivered' 
                          ? 'bg-delivered text-white' 
                          : delivery.status === 'pending'
                          ? 'bg-yellow-500 text-white border-2 border-yellow-300'
                          : 'bg-secondary text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(delivery, 'delivery');
                      }}
                    >
                      <span className="truncate">
                        {delivery.supplier.name} - {formatQuantity(delivery.quantity, delivery.unit)}
                      </span>
                      <div className="flex items-center ml-1 flex-shrink-0">
                        {delivery.status === 'pending' && (
                          <span className="w-2 h-2 bg-orange-300 rounded-full mr-1" title="En attente de validation" />
                        )}
                        {delivery.status === 'delivered' && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Create Button */}
              {isCurrentMonth && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="w-6 h-6 bg-accent text-white rounded-full p-0 hover:bg-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(date);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
