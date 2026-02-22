"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { PrintServiceIndicator } from "../order-wizard/components/print-service";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onCreateOrder?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  title,
  subtitle,
  onCreateOrder,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  return (
    <header className="flex h-auto items-center justify-between p-6 ios-glass rounded-md shrink-0 bg-card">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <PrintServiceIndicator />

        <ThemeToggle />

        {onCreateOrder && (
          <Button onClick={onCreateOrder} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Crear Pedido
          </Button>
        )}
      </div>
      {/* {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-card"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
          />
          Actualizar
        </Button>
      )} */}
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
