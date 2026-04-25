"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/order";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-sky-600 bg-sky-50 border-sky-200",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  returned: {
    label: "Returned",
    icon: AlertCircle,
    color: "text-slate-600 bg-slate-50 border-slate-200",
  },
};

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(
    currentStatus as keyof typeof STATUS_CONFIG,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newStatus: string) => {
    if (newStatus === status) return;
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setStatus(newStatus as keyof typeof STATUS_CONFIG);
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isUpdating}
            variant="outline"
            className={cn(
              "h-12 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] gap-2 px-6 shadow-sm transition-all",
              config.color,
            )}
          >
            {isUpdating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <config.icon className="size-4" />
            )}
            {config.label}
            <ChevronDown className="size-3 opacity-50 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200"
        >
          {(
            Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
          ).map((s) => {
            const sc = STATUS_CONFIG[s];
            return (
              <DropdownMenuItem
                key={s}
                onClick={() => handleUpdate(s)}
                className={cn(
                  "rounded-xl p-3 flex items-center gap-3 cursor-pointer",
                  status === s ? "bg-slate-100 font-bold" : "hover:bg-slate-50",
                )}
              >
                <sc.icon className={cn("size-4", sc.color.split(" ")[0])} />
                <span className="text-xs font-bold text-slate-700">
                  {sc.label}
                </span>
                {status === s && (
                  <CheckCircle2 className="size-3.5 ml-auto text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
