"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, User, DollarSign, Edit } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatCurrency, getRelativeTime } from "@/lib/utils/format";
import { useTogglePaymentStatus } from "@/lib/hooks/orders/use-orders";
import { cn } from "@/lib/utils";

const statusConfig = {
  new: { label: "Nuevo", className: "bg-blue-500 text-white" },
  ready: { label: "Listo", className: "bg-green-500 text-white" },
  completed: { label: "Completado", className: "bg-gray-500 text-white" },
  canceled: { label: "Cancelado", className: "bg-red-500 text-white" },
};

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  isDragging?: boolean;
  visualStatus?: Order["status"];
}

export function OrderCard({
  order,
  onViewDetails,
  onEditOrder,
  isDragging,
  visualStatus = order.status,
}: OrderCardProps) {
  const canEdit = order.status === "new" || order.status === "ready";
  const togglePayment = useTogglePaymentStatus();

  const handlePaymentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePayment.mutate({ orderId: order.id, isPaid: !order.is_paid });
  };

  const status = visualStatus ?? order.status;
  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <Card
      className={cn(
        "hidden lg:block transition-all hover:shadow-md cursor-grab bg-card",
        isDragging && "rotate-1",
      )}
    >
      <CardContent className="p-4">
        {/* Header: Número, Badge y Payment Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <p className="font-mono text-lg font-semibold">
              #{order.order_number}
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{getRelativeTime(order.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={config.className}>{config.label}</Badge>
            <button
              onClick={handlePaymentToggle}
              className={cn(
                "rounded-full p-2 transition-colors cursor-pointer",
                order.is_paid
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-red-100 text-red-600 hover:bg-red-200",
              )}
              title={
                order.is_paid
                  ? "Pagado - Click para marcar como no pagado"
                  : "No pagado - Click para marcar como pagado"
              }
            >
              <DollarSign className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info: Cliente y Tiempo */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{order.customer_name}</span>
          </div>
        </div>

        {/* Footer: Total y Acciones */}
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-2xl font-bold">
            {formatCurrency(order.total_amount)}
          </p>

          <div className="flex items-center gap-2">
            {canEdit && onEditOrder && (
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditOrder(order);
                }}
              >
                <Edit className="mr-1.5 h-4 w-4" />
                Editar
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              className="cursor-pointer"
              onClick={() => onViewDetails(order)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Ver detalles
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
