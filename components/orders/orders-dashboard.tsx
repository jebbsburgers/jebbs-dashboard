"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { OrderColumn } from "./order-column";
import { OrderDetailsModal } from "./order-details-modal";
import { OrderWizardDrawer } from "../order-wizard/order-wizard-drawer";
import {
  useOrders,
  useTodayOrdersCount,
  useUpdateOrderStatus,
  useTogglePaymentStatus,
} from "@/lib/hooks/orders/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/lib/types";
import { ClipboardList, Check } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { OrderCard } from "./order-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePrintOrder } from "@/lib/hooks/use-print-order";
import { useOrderForEdit } from "@/lib/hooks/orders/use-order-for-edit";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@/lib/types";

export function OrdersDashboard() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading, refetch, isRefetching } = useOrders();
  const { data: todayCount } = useTodayOrdersCount();
  const updateStatus = useUpdateOrderStatus();
  const togglePayment = useTogglePaymentStatus();
  const printOrder = usePrintOrder();

  const [orderIdToEdit, setOrderIdToEdit] = useState<string | null>(null);
  const { data: orderToEdit } = useOrderForEdit(orderIdToEdit);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (orderToEdit && orderIdToEdit) {
      setWizardOpen(true);
    }
  }, [orderToEdit, orderIdToEdit]);

  const handleDragStart = (event: any) => {
    const order = orders?.find((o) => o.id === event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveOrder(null);
      return;
    }

    const orderId = active.id as string;
    const newStatus = over.id as OrderStatus;

    // 🆕 CRÍTICO: Update optimista INMEDIATO antes de limpiar activeOrder
    queryClient.setQueryData<Order[]>(["orders"], (old) => {
      if (!old) return old;
      return old.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : order,
      );
    });

    // LUEGO limpiar activeOrder
    setActiveOrder(null);

    // Y finalmente ejecutar la mutación en background
    updateStatus.mutate({ orderId, status: newStatus });
  };

  const handleCompleteOrder = (order: Order) => {
    if (!order.is_paid) {
      setOrderToComplete(order);
      setPaymentDialogOpen(true);
    } else {
      updateStatus.mutate({ orderId: order.id, status: "completed" });
    }
  };

  const handleConfirmComplete = () => {
    if (!orderToComplete) return;

    togglePayment.mutate(
      { orderId: orderToComplete.id, isPaid: true },
      {
        onSuccess: () => {
          updateStatus.mutate({
            orderId: orderToComplete.id,
            status: "completed",
          });
        },
      },
    );

    setPaymentDialogOpen(false);
    setOrderToComplete(null);
  };

  const handleEditOrder = (order: Order) => {
    setOrderIdToEdit(order.id);
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      setOrderIdToEdit(null);
    }
  };

  const readyOrders = orders?.filter((o) => o.status === "ready") ?? [];

  return (
    <section className="flex flex-1 flex-col min-h-0">
      <Header
        title="Pedidos"
        subtitle="Interfaz de administración de pedidos"
        onCreateOrder={() => setWizardOpen(true)}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      />

      {/* MAIN */}
      <div className="flex-1 min-h-0 flex flex-col py-6">
        <div className="flex-1">
          {isLoading ? (
            <div className="grid h-full grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="p-4">
                  <Skeleton className="mb-4 h-8 w-32" />
                  <Skeleton className="h-40 w-full mb-3" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="flex-1 min-h-0 flex h-full">
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex-1 min-h-0 ">
                  <div className="grid h-full min-h-0 grid-cols-2 gap-6">
                    <OrderColumn
                      title="Nuevos"
                      status="new"
                      orders={orders ?? []}
                      onViewDetails={(o) => {
                        setSelectedOrder(o);
                        setDetailsOpen(true);
                      }}
                      onEditOrder={handleEditOrder}
                      accentColor="bg-blue-500"
                    />
                    <OrderColumn
                      title="Listos"
                      status="ready"
                      orders={orders ?? []}
                      onViewDetails={(o) => {
                        setSelectedOrder(o);
                        setDetailsOpen(true);
                      }}
                      onEditOrder={handleEditOrder}
                      accentColor="bg-green-500"
                    />
                  </div>
                </div>

                <DragOverlay adjustScale={false}>
                  {activeOrder ? (
                    <div className="pointer-events-none ">
                      <OrderCard
                        order={activeOrder}
                        visualStatus={activeOrder.status}
                        onViewDetails={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="rounded-full bg-muted p-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Sin pedidos activos
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Los nuevos pedidos aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border border-border rounded-md bg-card p-4 min-h-17.5 shrink-0">
        <div className="flex h-full items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">
              Total pedidos del día:{" "}
            </span>
            <span className="font-semibold">{todayCount ?? 0}</span>
          </div>

          {readyOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Pedidos listos:
              </span>
              {readyOrders.map((order) => (
                <Button
                  key={order.id}
                  size="sm"
                  onClick={() => handleCompleteOrder(order)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Completar #{order.order_number}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEditOrder={handleEditOrder}
      />

      <OrderWizardDrawer
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        mode={orderToEdit ? "edit" : "create"}
        orderToEdit={orderToEdit}
      />

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pedido no pagado</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido #{orderToComplete?.order_number} aún no está marcado
              como pagado. ¿Desea marcarlo como pagado y completarlo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Marcar pagado y completar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
