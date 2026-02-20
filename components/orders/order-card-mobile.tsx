"use client";

import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Edit, User, DollarSign } from "lucide-react"; // 🆕 Importar Edit
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

interface OrderCardMobileProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onEditOrder?: (order: Order) => void; // 🆕
}

export function OrderCardMobile({
  order,
  onViewDetails,
  onEditOrder, // 🆕
}: OrderCardMobileProps) {
  const togglePayment = useTogglePaymentStatus();
  const status = order.status;
  const config = statusConfig[status];

  // 🆕 Verificar si se puede editar
  const canEdit = order.status === "new" || order.status === "ready";

  const handlePaymentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePayment.mutate({ orderId: order.id, isPaid: !order.is_paid });
  };

  return (
    <Card className="lg:hidden bg-card">
      <CardContent className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-lg font-semibold">
            #{order.order_number}
          </p>

          <div className="flex items-center gap-2">
            {/* PAGO */}
            <button
              onClick={handlePaymentToggle}
              className={cn(
                "rounded-full p-2 transition-colors",
                order.is_paid
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600",
              )}
            >
              <DollarSign className="h-4 w-4" />
            </button>

            {/* ESTADO */}
            <Badge className={config.className}>{config.label}</Badge>
          </div>
        </div>

        {/* META + TOTAL */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {order.customer_name}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {getRelativeTime(order.created_at)}
            </div>
          </div>

          <div className="text-xl font-bold text-right">
            {formatCurrency(order.total_amount)}
          </div>
        </div>

        {/* 🆕 BOTONES (Ver detalles + Editar) */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-card"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </Button>

          {/* 🆕 Botón EDITAR (solo si canEdit) */}
          {canEdit && onEditOrder && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-card"
              onClick={() => onEditOrder(order)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
