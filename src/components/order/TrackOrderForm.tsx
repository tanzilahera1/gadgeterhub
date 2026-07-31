// src/components/order/TrackOrderForm.tsx
"use client";
import { useState, useRef } from "react";
import {
  Search,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Hash,
  HelpCircle,
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

type TrackedOrder = Pick<
  IOrder,
  | "orderNumber"
  | "channelSource"
  | "orderStatus"
  | "paymentMethod"
  | "total"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "discount"
  | "couponCode"
  | "createdAt"
  | "shipping"
>;

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchTrackStatus = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.error("আপনার Order ID বা ফোন নম্বর দিন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/order/track?orderId=${encodeURIComponent(searchQuery.trim())}`,
      );
      const data = (await res.json()) as {
        success: boolean;
        order?: TrackedOrder;
        error?: string;
      };

      if (data.success && data.order) {
        setOrder(data.order);
        setTimeout(() => {
          const element = resultRef.current;
          if (element) {
            const elementRect = element.getBoundingClientRect();
            const headerOffset = 40;
            const viewportCenter = window.innerHeight / 2;
            const scrollTarget =
              elementRect.top + window.scrollY - headerOffset - viewportCenter / 2;

            window.scrollTo({
              top: scrollTarget,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        toast.error(data.error ?? "Order খুঁজে পাওয়া যায়নি");
        setOrder(null);
      }
    } catch {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchTrackStatus(orderId);
  };

  const getStatusIndex = (status: string): number => {
    return STAGES.findIndex((s) => s.id === status);
  };

  return (
    <div className="space-y-12" suppressHydrationWarning>
      {/* Search Section */}
      <form
        onSubmit={handleTrack}
        className="max-w-xl mx-auto space-y-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-slate-200/50"
      >
        <div className="space-y-2 text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="size-3.5" /> স্মার্ট অর্ডারি ট্র্যাকিং
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            আপনার শিপমেন্ট ট্র্যাক করুন
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            অর্ডার আইডি বা মোবাইল নম্বর যেকোনো স্টাইলে ইনপুট দিয়ে লাইভ স্ট্যাটাস দেখুন
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
              <Hash className="size-3.5 text-primary" /> Order ID বা ফোন নম্বর
            </label>
            <Input
              placeholder="যেমন: GH-FBP-260731-0005 বা 01754154374"
              className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 font-bold text-base sm:text-lg focus-visible:ring-primary/20 focus-visible:border-primary transition-all px-5"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>

          {/* Super UX Helper Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-black">
              <HelpCircle className="size-4 text-primary shrink-0" />
              <span>সার্চ করার ৩টি সহজ উপায়:</span>
            </div>
            <ul className="text-[11px] font-medium text-slate-600 space-y-1.5 pl-6 list-disc">
              <li>
                <strong className="text-slate-900">ইনভয়েস ID দিয়ে:</strong> যেমন{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border text-primary font-bold">
                  GH-FBP-260731-0005
                </code>
              </li>
              <li>
                <strong className="text-slate-900">সংক্ষিপ্ত নম্বর দিয়ে:</strong> ড্যাশ, স্পেস বা স্মল লেটারেও লিখতে পারেন (যেমন:{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border text-slate-800 font-bold">
                  260731-0005
                </code>
                )
              </li>
              <li>
                <strong className="text-slate-900">ফোন নম্বর দিয়ে:</strong> অর্ডার করার সময় ব্যবহৃত আপনার{" "}
                <strong className="text-primary">১১ ডিজিটের মোবাইল নম্বর</strong> দিলেই চলবে।
              </li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {loading ? (
            "খুঁজছি..."
          ) : (
            <>
              <Search className="size-4" />
              স্ট্যাটাস দেখুন
            </>
          )}
        </Button>
      </form>

      {/* Result Section */}
      {order && (
        <div
          ref={resultRef}
          className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 size-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                  বর্তমান অগ্রগতি
                </p>
                <h3 className="text-3xl font-black tracking-tight">
                  Order {order.orderNumber}
                </h3>
                <p className="text-slate-400 font-bold text-sm">
                  নাম: {order.shipping.name}
                </p>
              </div>
              <div className="text-left md:text-right space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                  মোট পরিমাণ
                </p>
                <p className="text-3xl font-black text-white">
                  {formatPrice(order.total)}
                </p>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/5">
                  পদ্ধতি: {order.paymentMethod}
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
                            সক্রিয়
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
                ডেলিভারি ঠিকানা
              </h4>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">
                  {[
                    order.shipping.addressLine1,
                    order.shipping.addressLine2,
                    order.shipping.city,
                    order.shipping.district,
                  ]
                    .filter((p): p is string => Boolean(p) && !/outside dhaka|inside dhaka|^dhaka$/i.test(p!.trim()))
                    .join(", ") || order.shipping.addressLine1}
                </p>
                <p className="text-xs font-bold text-primary">
                  জোন: {order.shipping.deliveryZone || (order.shippingCost > 80 ? "OSD (Outside Dhaka)" : "ISD (Inside Dhaka)")}
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                সহায়তা কেন্দ্র
              </h4>
              <p className="text-sm font-medium text-slate-500">
                আপনার Order নিয়ে সাহায্য লাগবে? আমাদের সাপোর্ট টিম সবসময়
                প্রস্তুত।
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-black uppercase text-[10px] tracking-widest gap-2"
              >
                যোগাযোগ করুন <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
