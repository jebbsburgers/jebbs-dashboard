"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus, OrderWithItems } from "@/lib/types";

export function useOrders() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["new", "ready"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 10000,
  });
}

export function useOrderWithItems(orderId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,

    queryFn: async () => {
      if (!orderId) return null;

      // 1️⃣ Pedido + dirección relacionada
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          `
    *,
    customer_address: customer_addresses (
      id,
      label,
      address,
      is_default
    )
  `,
        )
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // 2️⃣ Items del pedido
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        return { ...order, items: [] } as OrderWithItems;
      }

      // 3️⃣ Extras por item
      const itemsWithExtras = await Promise.all(
        items.map(async (item) => {
          const { data: extras, error: extrasError } = await supabase
            .from("order_item_extras")
            .select("*")
            .eq("order_item_id", item.id);

          if (extrasError) throw extrasError;

          return {
            ...item,
            extras: extras ?? [],
          };
        }),
      );

      return {
        ...order,
        items: itemsWithExtras,
      } as OrderWithItems;
    },
  });
}

// 🆕 SOLUCIÓN 2: Optimistic update + refetch silencioso
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      return { orderId, status };
    },

    onMutate: async ({ orderId, status }) => {
      // 🔒 Cancelar refetches automáticos
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      // 📸 Backup del estado anterior
      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      // ⚡ Update optimista INMEDIATO
      queryClient.setQueryData<Order[]>(["orders"], (old) => {
        if (!old) return old;

        // Actualizar el pedido y filtrar si ya no es "new" o "ready"
        return (
          old
            .map((order) =>
              order.id === orderId
                ? { ...order, status, updated_at: new Date().toISOString() }
                : order,
            )
            // 🆕 Filtrar pedidos que no son "new" o "ready"
            .filter(
              (order) => order.status === "new" || order.status === "ready",
            )
        );
      });

      return { previousOrders };
    },

    onError: (_err, _vars, context) => {
      // 🔙 Restaurar en caso de error
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },

    onSuccess: () => {
      // 🆕 Refetch silencioso en background (sin afectar UI)
      queryClient.refetchQueries({
        queryKey: ["orders"],
        type: "active",
      });

      // Invalidar historial normalmente
      queryClient.invalidateQueries({
        queryKey: ["orders-history"],
        exact: false,
      });
    },
  });
}

export function useTogglePaymentStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      isPaid,
    }: {
      orderId: string;
      isPaid: boolean;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;
    },
    onMutate: async ({ orderId, isPaid }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      queryClient.setQueryData<Order[]>(["orders"], (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === orderId ? { ...order, is_paid: isPaid } : order,
        );
      });

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;
    },

    onMutate: async ({ orderId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["orders"] }),
        queryClient.cancelQueries({ queryKey: ["orders-history"] }),
      ]);

      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      // ⚡ Optimistic update + filtrar pedido cancelado
      queryClient.setQueryData<Order[]>(["orders"], (old) =>
        old
          ?.map((order) =>
            order.id === orderId
              ? { ...order, status: "canceled" as OrderStatus }
              : order,
          )
          .filter(
            (order) => order.status === "new" || order.status === "ready",
          ),
      );

      return { previousOrders };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders-history"],
        exact: false,
      });
    },
  });
}

export function useReactivateOrder() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      nextStatus,
    }: {
      orderId: string;
      nextStatus: "new" | "completed";
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;
    },

    onMutate: async ({ orderId, nextStatus }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["orders"] }),
        queryClient.cancelQueries({ queryKey: ["orders-history"] }),
      ]);

      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      queryClient.setQueryData<Order[]>(["orders"], (old) =>
        old?.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order,
        ),
      );

      return { previousOrders };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders-history"],
        exact: false,
      });
    },
  });
}

export function useCompleteOrder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          pending_print: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useTodayOrdersCount() {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["orders-count-today"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}
