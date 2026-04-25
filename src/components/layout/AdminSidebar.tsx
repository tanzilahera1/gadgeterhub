"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Tags,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Brands", href: "/admin/brands", icon: Tags },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } =
    useSidebar();

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-slate-950 text-slate-300 z-50 transition-all duration-300 border-r border-slate-800 shadow-2xl flex flex-col",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-800/50 px-4",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <Link
              href="/"
              className="flex items-center gap-1.5 ml-2 overflow-hidden whitespace-nowrap"
            >
              <span className="text-xl font-black text-white tracking-tight">
                Admin Panel
              </span>
            </Link>

          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="hidden lg:flex rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-xl text-slate-500 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar mt-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : ""}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "justify-center h-12" : "px-4 py-3 gap-3",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "size-5 shrink-0 transition-all",
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-white",
                  )}
                />

                {!isCollapsed && (
                  <>
                    <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                    {isActive && (
                      <ChevronRight className="size-3.5 ml-auto opacity-50" />
                    )}
                  </>
                )}

                {isCollapsed && isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={cn(
            "p-3 border-t border-slate-900 bg-slate-950/50",
            isCollapsed ? "flex justify-center" : "",
          )}
        >
          <Button
            variant="ghost"
            className={cn(
              "text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-200",
              isCollapsed
                ? "size-12 p-0"
                : "w-full flex items-center justify-start gap-4 px-4 h-12",
            )}
          >
            <LogOut className="size-5 shrink-0" />
            {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
