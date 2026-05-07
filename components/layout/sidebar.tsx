"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  UtensilsCrossed,
  Plus,
  DollarSign,
  Component,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Pacifico, Baloo_2 } from "next/font/google";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
});

const navigation = [
  { name: "Pedidos", href: "/", icon: LayoutDashboard },
  { name: "Historial", href: "/historial", icon: ClipboardList },
  { name: "Rendimiento", href: "/rendimiento", icon: BarChart3 },
  { name: "Clientes", href: "/clientes", icon: User },
  { name: "Menú", href: "/menu", icon: UtensilsCrossed },
  { name: "Combos", href: "/combos", icon: Component },
  { name: "Extras", href: "/extras", icon: Plus },
  { name: "Precios", href: "/precios", icon: DollarSign },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating" className="ios-sidebar">
      <SidebarHeader className="pb-0">
        <div className="flex items-center gap-3 px-1 py-2">
          <Image
            src="/jebbs.jpg"
            alt="Logo"
            width={48}
            height={48}
            className="rounded-full shrink-0"
          />
          <div
            className="
              flex flex-col leading-tight
              transition-all duration-200
              group-data-[collapsible=icon]:hidden
            "
          >
            <span className={cn(baloo.className, "text-lg font-bold tracking-wide")}>
              Jebbs
            </span>
            <span className={cn(pacifico.className, "text-base text-(--color-jebbs) -mt-1")}>
              Burgers
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        "rounded-xl transition-all duration-200",
                        isActive && "bg-sidebar-accent font-medium",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
