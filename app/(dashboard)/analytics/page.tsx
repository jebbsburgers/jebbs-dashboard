"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  Receipt,
} from "lucide-react";
import {
  useOrdersAnalytics,
  useMonthlyComparison,
} from "@/lib/hooks/orders/use-orders-history";
import { formatCurrency } from "@/lib/utils/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: analytics, isLoading: analyticsLoading } =
    useOrdersAnalytics(selectedMonth);
  const { data: monthlyComparison, isLoading: comparisonLoading } =
    useMonthlyComparison();

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const metrics = [
    {
      title: "Pedidos completados",
      value: analytics?.completedOrders || 0,
      change: analytics?.completedOrdersChange || 0,
      format: (v: number) => v.toString(),
      icon: ShoppingBag,
      color: "var(--color-chart-1)",
    },
    {
      title: "Ingresos totales",
      value: analytics?.totalRevenue || 0,
      change: analytics?.revenueChange || 0,
      format: formatCurrency,
      icon: DollarSign,
      color: "var(--color-chart-2)",
    },
    {
      title: "Promedio pedidos/día",
      value: analytics?.avgOrdersPerDay || 0,
      change: analytics?.avgOrdersPerDayChange || 0,
      format: (v: number) => v.toFixed(1),
      icon: Calendar,
      color: "var(--color-chart-3)",
    },
    {
      title: "Ticket promedio",
      value: analytics?.avgTicket || 0,
      change: analytics?.avgTicketChange || 0,
      format: formatCurrency,
      icon: Receipt,
      color: "var(--color-chart-4)",
    },
  ];

  const monthLabel = selectedMonth.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const ordersChartConfig = {
    orders: {
      label: "Pedidos",
      color: "var(--color-chart-1)",
    },
  };

  const revenueChartConfig = {
    revenue: {
      label: "Ingresos",
      color: "var(--color-chart-2)",
    },
  };

  const comparisonChartConfig = {
    orders: {
      label: "Pedidos",
      color: "var(--color-chart-1)",
    },
    revenue: {
      label: "Ingresos",
      color: "var(--color-chart-2)",
    },
  };

  return (
    <section className="flex h-screen flex-col">
      <Header title="Rendimiento" subtitle="Análisis mensual de ventas" />

      <div className="flex-1 overflow-auto py-4">
        <div className="mb-6 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="bg-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-45 text-center font-medium capitalize">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="bg-card"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {analyticsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const isPositive = metric.change >= 0;
              return (
                <Card key={metric.title} className="ios-glass p-0 bg-card">
                  <CardContent className="h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${metric.color} 15%, transparent)`,
                        }}
                      >
                        <metric.icon
                          className="h-5 w-5"
                          style={{ color: metric.color }}
                        />
                      </div>

                      <div
                        className={`flex items-center gap-1 text-sm ${
                          isPositive
                            ? "text-[var(--status-paid)]"
                            : "text-[var(--status-canceled)]"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{Math.abs(metric.change).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-2xl font-bold">
                        {metric.format(metric.value)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {metric.title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Pedidos */}
          <Card className="ios-glass bg-card">
            <CardHeader>
              <CardTitle>Pedidos por día</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading || !analytics?.dailyData ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ChartContainer
                  config={ordersChartConfig}
                  className="h-[300px] w-full"
                >
                  <AreaChart data={analytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).getDate().toString()}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v) =>
                            new Date(v).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                            })
                          }
                        />
                      }
                    />
                    <Area
                      dataKey="orders"
                      stroke="var(--color-chart-1)"
                      fill="var(--color-chart-1)"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Ingresos */}
          <Card className="ios-glass bg-card">
            <CardHeader>
              <CardTitle>Ingresos por día</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading || !analytics?.dailyData ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ChartContainer
                  config={revenueChartConfig}
                  className="h-[300px] w-full"
                >
                  <AreaChart data={analytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).getDate().toString()}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v) =>
                            new Date(v).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                            })
                          }
                          formatter={(v) => [
                            formatCurrency(v as number),
                            " - Ingresos",
                          ]}
                        />
                      }
                    />
                    <Area
                      dataKey="revenue"
                      stroke="var(--color-chart-2)"
                      fill="var(--color-chart-2)"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparativa */}
        <Card className="mt-6 ios-glass bg-card">
          <CardHeader>
            <CardTitle>Comparativa últimos 3 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonLoading || !monthlyComparison ? (
              <Skeleton className="h-75" />
            ) : (
              <ChartContainer
                config={comparisonChartConfig}
                className="h-75 w-full"
              >
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v, name) => {
                          console.log("Tooltip name:", name);

                          return name === "revenue"
                            ? [formatCurrency(v as number), " - Ingresos"]
                            : [v, "- Pedidos"];
                        }}
                      />
                    }
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
