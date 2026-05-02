// src/components/order/TrackOrderForm.tsx
"use client";
import { useState } from "react";
import {
  Search,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/priceUtils";
import { toast } from "sonner";
import type { IOrder } from "@/types/order";

const STAGES = [
  { id: "pending", label: "Order Placed", icon: Clock },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "processing", label: "Processing", icon: Package },
  { id: "shipped", label: "On the Way", icon: Truck },
  { id: "delivered", label: "Delivered", icon: MapPin },
];

// Track এর জন্য শুধু যা দরকার তা Pick করা
type TrackedOrder = Pick<
  IOrder,
  | "orderNumber"
  | "orderStatus"
  | "paymentMethod"
  | "total"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "discount"
  | "couponCode"
  | "createdAt"
> & {
  shipping: {
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
  };
};

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTrack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orderId || !phone) {
      toast.error("Please enter both Order ID and Phone Number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/order/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`,
      );
      const data = (await res.json()) as {
        success: boolean;
        order?: TrackedOrder;
        error?: string;
      };

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        toast.error(data.error ?? "Order not found");
        setOrder(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string): number => {
    return STAGES.findIndex((s) => s.id === status);
  };

  return (
    <div className="space-y-12">
      {/* Search Section */}
      <form
        onSubmit={handleTrack}
        className="max-w-xl mx-auto space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-primary/5"
      >
        <div className="space-y-2 text-center mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Public Portal
          </p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Track Your Shipment
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Order Number
            </label>
            <Input
              placeholder="e.g. ORD-2024-XXXX"
              className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-primary/20 transition-all px-6"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Phone Number
            </label>
            <Input
              placeholder="e.g. 01XXXXXXXXX"
              className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-primary/20 transition-all px-6"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {loading ? (
            "Searching..."
          ) : (
            <>
              <Search className="size-4" />
              Track Status
            </>
          )}
        </Button>
      </form>

      {/* Result Section */}
      {order && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 size-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                  Current Progress
                </p>
                <h3 className="text-3xl font-black tracking-tight">
                  Order #{order.orderNumber}
                </h3>
                <p className="text-slate-400 font-bold text-sm">
                  Name: {order.shipping.name}
                </p>
              </div>
              <div className="text-left md:text-right space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                  Total Amount
                </p>
                <p className="text-3xl font-black text-white">
                  {formatPrice(order.total)}
                </p>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/5">
                  Method: {order.paymentMethod}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-16 relative">
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-white/10 hidden md:block" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 overflow-hidden">
                {STAGES.map((stage, idx) => {
                  const isActive = getStatusIndex(order.orderStatus) >= idx;
                  const isCurrent = order.orderStatus === stage.id;

                  return (
                    <div
                      key={stage.id}
                      className="relative flex md:flex-col items-center gap-4 md:text-center group"
                    >
                      <div
                        className={cn(
                          "size-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20"
                            : "bg-white/5 text-white/20",
                        )}
                      >
                        <stage.icon
                          className={cn("size-6", isCurrent && "animate-pulse")}
                        />
                      </div>
                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            isActive ? "text-white" : "text-white/20",
                          )}
                        >
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Shipping To
              </h4>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">
                  {order.shipping.address}
                </p>
                <p className="text-sm font-medium text-slate-500">
                  {order.shipping.city}, {order.shipping.district}
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Support Center
              </h4>
              <p className="text-sm font-medium text-slate-500">
                Need help with your order? Our support team is here to assist
                you.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-black uppercase text-[10px] tracking-widest gap-2"
              >
                Contact Support <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
