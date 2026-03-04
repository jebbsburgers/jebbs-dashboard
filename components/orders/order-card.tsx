"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, User, DollarSign, Edit, ArrowRight, Copy, Timer } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatCurrency, getRelativeTime } from "@/lib/utils/format";
import { useTogglePaymentStatus } from "@/lib/hooks/orders/use-orders";
import { cn } from "@/lib/utils";
import { formatOrderForWhatsapp } from "@/lib/utils/formatOrderWhatsapp";
import { toast } from "sonner";

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
  onChangeStatus?: (order: Order) => void;
}

export function OrderCard({
  order,
  onViewDetails,
  onEditOrder,
  isDragging,
  onChangeStatus,
  visualStatus = order.status,
}: OrderCardProps) {
  const canEdit = order.status === "new" || order.status === "ready";
  const togglePayment = useTogglePaymentStatus();

  const handlePaymentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePayment.mutate({ orderId: order.id, isPaid: !order.is_paid });
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatOrderForWhatsapp(order);
    await navigator.clipboard.writeText(text);
    toast.success("Pedido copiado para WhatsApp");
  };

  const status = visualStatus ?? order.status;
  const config = statusConfig[status as keyof typeof statusConfig];

  console.log(order)

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-grab bg-card",
        isDragging && "rotate-1",
      )}
    >
      <CardContent className="p-4">

        {/* Delivery time banner — shown at the very top when available */}
        {order.delivery_time && (
          <div className="flex items-center gap-2 mb-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {order.delivery_type === "delivery" ? "Entrega:" : "Retira:"} {order.delivery_time}
            </span>
          </div>
        )}

        {/* Header: order number + time ago + status badge + payment */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <p className="font-mono text-lg font-semibold">
              #{order.order_number}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getRelativeTime(order.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
                       <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={handleCopy}
              title="Copiar para WhatsApp"
            >
              <Copy className="h-4 w-4" />
            </Button>
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

        {/* Customer name */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <User className="h-4 w-4" />
          <span>{order.customer_name}</span>
        </div>

        {/* Footer: total + actions */}
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

        {/* Status advance button */}
        <div className="mt-3 w-full flex justify-end">
          {onChangeStatus &&
            (order.status === "new" || order.status === "ready") && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer bg-card"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(order);
                }}
              >
                <ArrowRight className="mr-1.5 h-4 w-4" />
                {order.status === "new" ? "Listo" : "Completar"}
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}