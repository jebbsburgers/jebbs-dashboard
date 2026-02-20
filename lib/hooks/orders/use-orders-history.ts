"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export function useOrdersHistory(dateRange: { from: Date; to: Date }) {
  const supabase = createClient();

  return useQuery({
    queryKey: [
      "orders-history",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customer:customers (
            id,
            name,
            phone,
            customer_addresses (
              id,
              label,
              address,
              notes,
              is_default
            )
          ),
          order_items (
            id,
            burger_name,
            quantity,
            unit_price,
            subtotal,
            customizations,
            order_item_extras (
              id,
              extra_name,
              quantity,
              unit_price,
              subtotal
            )
          )
        `,
        )
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrdersAnalytics(month: Date) {
  const supabase = createClient();

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  const prevStartOfMonth = new Date(
    month.getFullYear(),
    month.getMonth() - 1,
    1,
  );
  const prevEndOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    0,
    23,
    59,
    59,
  );

  return useQuery({
    queryKey: ["orders-analytics", month.toISOString()],
    queryFn: async () => {
      // Current month orders
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString())
        .eq("status", "completed");

      if (currentError) throw currentError;

      // Previous month orders
      const { data: prevOrders, error: prevError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", prevStartOfMonth.toISOString())
        .lte("created_at", prevEndOfMonth.toISOString())
        .eq("status", "completed");

      if (prevError) throw prevError;

      const currentCompleted = currentOrders?.length || 0;
      const prevCompleted = prevOrders?.length || 0;

      const currentRevenue =
        currentOrders?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;
      const prevRevenue =
        prevOrders?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;

      const daysInMonth = endOfMonth.getDate();
      const avgOrdersPerDay = currentCompleted / daysInMonth;
      const prevAvgOrdersPerDay = prevCompleted / prevEndOfMonth.getDate();

      const avgTicket =
        currentCompleted > 0 ? currentRevenue / currentCompleted : 0;
      const prevAvgTicket = prevCompleted > 0 ? prevRevenue / prevCompleted : 0;

      // Daily data for charts
      const dailyData: { date: string; orders: number; revenue: number }[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(month.getFullYear(), month.getMonth(), d);
        const dayStr = dayDate.toISOString().split("T")[0];
        const dayOrders =
          currentOrders?.filter((o) => o.created_at.startsWith(dayStr)) || [];
        dailyData.push({
          date: dayStr,
          orders: dayOrders.length,
          revenue: dayOrders.reduce(
            (acc, o) => acc + Number(o.total_amount),
            0,
          ),
        });
      }

      return {
        completedOrders: currentCompleted,
        completedOrdersChange:
          prevCompleted > 0
            ? ((currentCompleted - prevCompleted) / prevCompleted) * 100
            : 0,
        totalRevenue: currentRevenue,
        revenueChange:
          prevRevenue > 0
            ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
            : 0,
        avgOrdersPerDay,
        avgOrdersPerDayChange:
          prevAvgOrdersPerDay > 0
            ? ((avgOrdersPerDay - prevAvgOrdersPerDay) / prevAvgOrdersPerDay) *
              100
            : 0,
        avgTicket,
        avgTicketChange:
          prevAvgTicket > 0
            ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100
            : 0,
        dailyData,
      };
    },
  });
}

export function useMonthlyComparison() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["monthly-comparison"],
    queryFn: async () => {
      const now = new Date();
      const months: { month: string; orders: number; revenue: number }[] = [];

      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
        );

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .gte("created_at", monthDate.toISOString())
          .lte("created_at", endOfMonth.toISOString())
          .eq("status", "completed");

        if (error) throw error;

        const monthName = monthDate.toLocaleDateString("es-AR", {
          month: "short",
        });
        months.push({
          month: monthName,
          orders: data?.length || 0,
          revenue:
            data?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0,
        });
      }

      return months;
    },
  });
}
