"use client";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import UserMenuButton from "@/components/layout/UserMenuButton";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, setMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 flex flex-col min-h-screen relative transition-all duration-300",
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9 rounded-xl hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:block">
              Management System
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <UserMenuButton />
          </div>
        </header>


        {/* Content */}
        <div className="flex-1 p-6 lg:p-8 relative">{children}</div>

        {/* Footer */}
        <footer className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          GadgetCollections Admin © 2026 • Powered by GadgetAdmin Engine
        </footer>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}

