"use client";

import type { Order, OrderStatus } from "@/lib/types";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import { SortableOrderCard } from "./sorteable-order-card";

interface OrderColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onEditOrder?: (order: Order) => void; // 🆕
  accentColor: string;
  onChangeStatus?: (order: Order) => void;
}

export function OrderColumn({
  title,
  status,
  orders,
  onViewDetails,
  onEditOrder, // 🆕
  accentColor,
  onChangeStatus,
}: OrderColumnProps) {
  const filteredOrders = orders.filter((order) => order.status === status);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-0 rounded-lg border ios-glass bg-card transition-colors",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <div className="shrink-0 flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${accentColor}`} />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium">
          {filteredOrders.length}
        </span>
      </div>
      <div
        className="
      flex-1 min-h-0 overflow-y-auto p-4 space-y-6
      max-h-[calc(100vh-240px)]
      lg:max-h-[calc(100vh-300px)]
    "
      >
        <SortableContext
          items={filteredOrders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredOrders.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Sin pedidos</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <SortableOrderCard
                key={order.id}
                order={order}
                onViewDetails={onViewDetails}
                onEditOrder={onEditOrder} // 🆕
                onChangeStatus={onChangeStatus} // 👈
              />
            ))
          )}

          {/* hint iOS-style */}
          {filteredOrders.length > 0 && (
            <div className="pointer-events-none mt-4 flex justify-center">
              <div className=" px-3 py-1 text-xs text-muted-foreground">
                - Arrastrá las tarjetas para cambiar su estado -
              </div>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
