"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

const TZ = "America/Argentina/Buenos_Aires";

// Get YYYY-MM-DD in Argentina timezone
function toArDateStr(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA = YYYY-MM-DD
}

// Build UTC Date from an Argentina local date string (YYYY-MM-DD)
// Argentina is always UTC-3 (no DST)
function arDateToUTC(dateStr: string, endOfDay = false): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const h = endOfDay ? 23 : 0;
  const m = endOfDay ? 59 : 0;
  const s = endOfDay ? 59 : 0;
  return new Date(Date.UTC(year, month - 1, day, h + 3, m, s));
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const ar = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const year = ar.getFullYear();
  const month = ar.getMonth();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;
  return { start: arDateToUTC(firstDay, false), end: arDateToUTC(lastDay, true) };
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const ar = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const day = ar.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ar);
  monday.setDate(ar.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: arDateToUTC(fmt(monday), false), end: arDateToUTC(fmt(sunday), true) };
}

export type ViewMode = "month" | "week";

// ─── useOrdersHistory ───────────────────────────────────────────────────────

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
        `
        )
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

// ─── useOrdersAnalytics ─────────────────────────────────────────────────────

export function useOrdersAnalytics(
  selectedDate: Date,
  viewMode: ViewMode = "month"
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["orders-analytics", selectedDate.toISOString(), viewMode],
    queryFn: async () => {
      const { start, end } =
        viewMode === "week"
          ? getWeekRange(selectedDate)
          : getMonthRange(selectedDate);

      // Previous period
      let prevStart: Date, prevEnd: Date;
      if (viewMode === "week") {
        const ms7 = 7 * 24 * 60 * 60 * 1000;
        prevStart = new Date(start.getTime() - ms7);
        prevEnd = new Date(end.getTime() - ms7);
      } else {
        const ar = new Date(selectedDate.toLocaleString("en-US", { timeZone: TZ }));
        const prevMonthDate = new Date(ar.getFullYear(), ar.getMonth() - 1, 1);
        ({ start: prevStart, end: prevEnd } = getMonthRange(prevMonthDate));
      }

      const [{ data: current, error: e1 }, { data: prev, error: e2 }, { data: canceled, error: e3 }, { data: prevCanceled, error: e4 }] =
        await Promise.all([
          supabase
            .from("orders")
            .select("total_amount, updated_at")
            .eq("status", "completed")
            .gte("updated_at", start.toISOString())
            .lte("updated_at", end.toISOString()),
          supabase
            .from("orders")
            .select("total_amount, updated_at")
            .eq("status", "completed")
            .gte("updated_at", prevStart.toISOString())
            .lte("updated_at", prevEnd.toISOString()),
          supabase
            .from("orders")
            .select("id, updated_at")
            .eq("status", "canceled")
            .gte("updated_at", start.toISOString())
            .lte("updated_at", end.toISOString()),
          supabase
            .from("orders")
            .select("id, updated_at")
            .eq("status", "canceled")
            .gte("updated_at", prevStart.toISOString())
            .lte("updated_at", prevEnd.toISOString()),
        ]);

      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;

      const currentCompleted = current?.length || 0;
      const prevCompleted = prev?.length || 0;
      const currentCanceled = canceled?.length || 0;
      const prevCanceled2 = prevCanceled?.length || 0;
      const currentRevenue =
        current?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;
      const prevRevenue =
        prev?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysInPeriod =
        Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
      const daysInPrev =
        Math.round((prevEnd.getTime() - prevStart.getTime()) / msPerDay) + 1;

      const avgOrdersPerDay = currentCompleted / daysInPeriod;
      const prevAvgOrdersPerDay = prevCompleted / daysInPrev;
      const avgTicket =
        currentCompleted > 0 ? currentRevenue / currentCompleted : 0;
      const prevAvgTicket =
        prevCompleted > 0 ? prevRevenue / prevCompleted : 0;

      const pct = (curr: number, p: number) =>
        p > 0 ? ((curr - p) / p) * 100 : 0;

      // Group completed by AR local date
      const dailyMap: Record<string, { orders: number; revenue: number; canceled: number }> = {};
      for (const o of current || []) {
        const key = toArDateStr(new Date(o.updated_at));
        if (!dailyMap[key]) dailyMap[key] = { orders: 0, revenue: 0, canceled: 0 };
        dailyMap[key].orders++;
        dailyMap[key].revenue += Number(o.total_amount);
      }
      // Group canceled by AR local date
      for (const o of canceled || []) {
        const key = toArDateStr(new Date(o.updated_at));
        if (!dailyMap[key]) dailyMap[key] = { orders: 0, revenue: 0, canceled: 0 };
        dailyMap[key].canceled++;
      }

      // Fill all days in range
      const dailyData: { date: string; day: number; orders: number; revenue: number; canceled: number }[] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toArDateStr(cursor);
        const dayNum = parseInt(key.split("-")[2], 10);
        dailyData.push({
          date: key,
          day: dayNum,
          orders: dailyMap[key]?.orders || 0,
          revenue: dailyMap[key]?.revenue || 0,
          canceled: dailyMap[key]?.canceled || 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return {
        completedOrders: currentCompleted,
        completedOrdersChange: pct(currentCompleted, prevCompleted),
        totalRevenue: currentRevenue,
        revenueChange: pct(currentRevenue, prevRevenue),
        avgOrdersPerDay,
        avgOrdersPerDayChange: pct(avgOrdersPerDay, prevAvgOrdersPerDay),
        avgTicket,
        avgTicketChange: pct(avgTicket, prevAvgTicket),
        canceledOrders: currentCanceled,
        canceledOrdersChange: pct(currentCanceled, prevCanceled2),
        dailyData,
      };
    },
  });
}

// ─── useMonthlyComparison ───────────────────────────────────────────────────

export function useMonthlyComparison() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["monthly-comparison"],
    queryFn: async () => {
      const arNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: TZ })
      );
      const months: { month: string; orders: number; revenue: number }[] = [];

      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(
          arNow.getFullYear(),
          arNow.getMonth() - i,
          1
        );
        const { start, end } = getMonthRange(monthDate);

        const { data, error } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("status", "completed")
          .gte("updated_at", start.toISOString())
          .lte("updated_at", end.toISOString());

        if (error) throw error;

        const raw = monthDate.toLocaleDateString("es-AR", {
          month: "short",
          timeZone: TZ,
        });
        months.push({
          month: raw.charAt(0).toUpperCase() + raw.slice(1),
          orders: data?.length || 0,
          revenue:
            data?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0,
        });
      }

      return months;
    },
  });
}

// ─── useTopBurgers ──────────────────────────────────────────────────────────

export interface TopBurger {
  id: string;
  name: string;
  image_url: string | null;
  totalSold: number;
  totalRevenue: number;
  rank: number;
}

export function useTopBurgers(
  selectedDate: Date,
  viewMode: ViewMode = "month"
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["top-burgers", selectedDate.toISOString(), viewMode],
    queryFn: async (): Promise<TopBurger[]> => {
      const { start, end } =
        viewMode === "week"
          ? getWeekRange(selectedDate)
          : getMonthRange(selectedDate);

      // Completed order IDs in range
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "completed")
        .gte("updated_at", start.toISOString())
        .lte("updated_at", end.toISOString());

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map((o) => o.id);

      // order_items uses burger_name (text) — consistent with existing useOrdersHistory select
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("burger_name, quantity, unit_price, subtotal")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Aggregate by burger_name
      const burgerMap: Record<
        string,
        { totalSold: number; totalRevenue: number }
      > = {};
      for (const item of items) {
        const key = item.burger_name;
        if (!key) continue;
        if (!burgerMap[key]) burgerMap[key] = { totalSold: 0, totalRevenue: 0 };
        burgerMap[key].totalSold += item.quantity;
        burgerMap[key].totalRevenue += Number(
          item.subtotal ?? item.unit_price * item.quantity
        );
      }

      // Fetch image_url from burgers table by name
      const burgerNames = Object.keys(burgerMap);
      const { data: burgerRows } = await supabase
        .from("burgers")
        .select("id, name, image_url")
        .in("name", burgerNames);

      const imageMap: Record<string, { id: string; image_url: string | null }> =
        {};
      for (const b of burgerRows || []) {
        imageMap[b.name] = { id: b.id, image_url: b.image_url };
      }

      return burgerNames
        .map((name) => ({
          id: imageMap[name]?.id ?? name,
          name,
          image_url: imageMap[name]?.image_url ?? null,
          totalSold: burgerMap[name].totalSold,
          totalRevenue: burgerMap[name].totalRevenue,
          rank: 0,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5)
        .map((b, i) => ({ ...b, rank: i + 1 }));
    },
  });
}