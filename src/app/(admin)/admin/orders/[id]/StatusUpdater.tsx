// src/app/admin/orders/[id]/StatusUpdater.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/order";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "amber" },
  { value: "confirmed", label: "Confirmed", color: "blue" },
  { value: "processing", label: "Processing", color: "indigo" },
  { value: "shipped", label: "Shipped", color: "purple" },
  { value: "delivered", label: "Delivered", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
  { value: "returned", label: "Returned", color: "gray" },
] as const;

interface Props {
  orderId: string;
  currentStatus: string;
}

export function StatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleChange = (newStatus: string) => {
    if (newStatus === status) return;

    const confirmed = confirm(
      `Are you sure you want to change status to "${newStatus}"?`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setStatus(newStatus);
        toast.success(`Status updated to ${newStatus}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Update Order Status
      </label>

      <div className="relative">
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isPending}
          className={cn(
            "w-full h-12 px-4 pr-10 rounded-xl border-2 border-border bg-background",
            "text-sm font-bold appearance-none cursor-pointer",
            "focus:outline-none focus:border-primary",
            "disabled:opacity-50 disabled:cursor-wait",
          )}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isPending ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}