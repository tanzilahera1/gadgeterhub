// src/app/(admin)/admin/orders/[id]/OrderDetailsClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Printer,
  Phone,
  MapPin,
  Package,
  CreditCard,
  User,
  Gift,
  Calendar,
  Hash,
  FileText,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/priceUtils";
import { StatusUpdater } from "./StatusUpdater";
import type { IOrderSerializable } from "@/types/order";
import { cn } from "@/lib/utils";

interface Props {
  order: IOrderSerializable;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-gray-100 text-gray-800 border-gray-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

export function OrderDetailsClient({ order }: Props) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isGiftOrder = order.customerPhone !== order.shipping.phone;

  const dateStr = new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const totalItems = order.items.reduce(
    (sum, item) => sum + item.itemQuantity,
    0,
  );

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-32 lg:pb-12">
      {/* ============ Sticky Header ============ */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0 size-9"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Order Details
              </p>
              <h1 className="text-sm sm:text-base font-black truncate">
                {order.orderNumber}
              </h1>
            </div>
          </div>

          <Link
            href={`/admin/orders/${order._id}/invoice`}
            target="_blank"
            rel="noopener"
            className="hidden sm:block"
          >
            <Button size="sm" className="gap-2 font-bold">
              <Printer className="size-4" />
              Print Invoice
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ============ Status Hero Card ============ */}
        <div className="bg-card rounded-2xl border border-border/40 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge
                    className={cn(
                      "uppercase text-[10px] font-black tracking-wider border",
                      ORDER_STATUS_STYLES[order.orderStatus],
                    )}
                  >
                    {order.orderStatus}
                  </Badge>
                  <Badge
                    className={cn(
                      "uppercase text-[10px] font-black tracking-wider border",
                      PAYMENT_STATUS_STYLES[order.paymentStatus],
                    )}
                  >
                    Payment: {order.paymentStatus}
                  </Badge>
                  {isGiftOrder && (
                    <Badge className="uppercase text-[10px] font-black tracking-wider bg-pink-100 text-pink-800 border-pink-200 border">
                      <Gift className="size-3 mr-1" />
                      Gift
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {dateStr}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Amount
              </p>
              <p className="text-2xl sm:text-3xl font-black text-primary leading-none">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
          <StatusUpdater
            orderId={order._id}
            currentStatus={order.orderStatus}
          />
        </div>

        {/* ============ Main Grid ============ */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* ============ Left: Items + Notes ============ */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Items Card */}
            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    Items ({order.items.length})
                  </h2>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  Qty: {totalItems}
                </span>
              </div>

              <div className="divide-y divide-border/40">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-4 flex gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
                      <Image
                        src={item.productImage}
                        alt={item.productTitle}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        target="_blank"
                        className="text-sm font-bold leading-snug hover:text-primary transition-colors line-clamp-2 inline-flex items-start gap-1"
                      >
                        {item.productTitle}
                        <ExternalLink className="size-3 shrink-0 mt-0.5 opacity-60" />
                      </Link>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        SKU: {item.productSku}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-foreground">
                          {formatPrice(item.unitPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          × {item.itemQuantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-black text-primary">
                        {formatPrice(item.unitPrice * item.itemQuantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="px-4 sm:px-6 py-4 bg-muted/30 border-t border-border/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-bold">
                    {formatPrice(order.shippingCost)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-bold text-green-600">
                      -{formatPrice(order.discount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-end pt-1">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Customer Payable
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-amber-700" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-900">
                    Customer Note
                  </h3>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">
                  {order.customerNotes}
                </p>
              </div>
            )}
          </div>

          {/* ============ Right: Customer & Payment ============ */}
          <div className="space-y-4 sm:space-y-6">
            {/* Customer / Shipping */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <User className="size-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">
                  {isGiftOrder ? "Delivery To" : "Customer"}
                </h2>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <InfoRow
                  icon={<User className="size-3.5" />}
                  label="Name"
                  value={order.shipping.name}
                />
                <InfoRow
                  icon={<Phone className="size-3.5" />}
                  label="Phone"
                  value={order.shipping.phone}
                  copyable
                  onCopy={() =>
                    handleCopy(order.shipping.phone, "ship-phone")
                  }
                  copied={copiedField === "ship-phone"}
                  href={`tel:${order.shipping.phone}`}
                />
                <InfoRow
                  icon={<MapPin className="size-3.5" />}
                  label="Address"
                  value={
                    <>
                      {order.shipping.addressLine1}
                      {order.shipping.addressLine2 && (
                        <>, {order.shipping.addressLine2}</>
                      )}
                      {order.shipping.district && (
                        <>
                          <br />
                          {order.shipping.district}
                          {order.shipping.city && `, ${order.shipping.city}`}
                          {order.shipping.postalCode &&
                            ` - ${order.shipping.postalCode}`}
                        </>
                      )}
                    </>
                  }
                />
              </div>

              {isGiftOrder && (
                <>
                  <div className="px-4 sm:px-5 py-3 border-y border-border/40 bg-pink-50 flex items-center gap-2">
                    <Gift className="size-4 text-pink-700" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-pink-900">
                      Order Placed By
                    </h2>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    <InfoRow
                      icon={<Phone className="size-3.5" />}
                      label="Customer Phone"
                      value={order.customerPhone}
                      copyable
                      onCopy={() =>
                        handleCopy(order.customerPhone, "cust-phone")
                      }
                      copied={copiedField === "cust-phone"}
                      href={`tel:${order.customerPhone}`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Payment
                </h2>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <InfoRow
                  icon={<Hash className="size-3.5" />}
                  label="Method"
                  value={
                    order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : order.paymentProvider?.toUpperCase() || "Mobile"
                  }
                />

                {order.paymentMethod === "mobile" && (
                  <>
                    {order.senderNumber && (
                      <InfoRow
                        icon={<Phone className="size-3.5" />}
                        label="Sender"
                        value={order.senderNumber}
                        copyable
                        onCopy={() =>
                          handleCopy(order.senderNumber!, "sender")
                        }
                        copied={copiedField === "sender"}
                      />
                    )}
                    {order.transactionId && (
                      <InfoRow
                        icon={<Hash className="size-3.5" />}
                        label="TrxID"
                        value={
                          <span className="font-mono">
                            {order.transactionId}
                          </span>
                        }
                        copyable
                        onCopy={() =>
                          handleCopy(order.transactionId!, "trx")
                        }
                        copied={copiedField === "trx"}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Timeline
                </h2>
              </div>
              <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                <TimelineRow label="Order Placed" date={order.createdAt} />
                {order.paidAt && (
                  <TimelineRow label="Payment Received" date={order.paidAt} />
                )}
                {order.shippedAt && (
                  <TimelineRow label="Shipped" date={order.shippedAt} />
                )}
                {order.deliveredAt && (
                  <TimelineRow label="Delivered" date={order.deliveredAt} />
                )}
                {order.cancelledAt && (
                  <TimelineRow
                    label="Cancelled"
                    date={order.cancelledAt}
                    danger
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Mobile Sticky Bottom Bar ============ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/40 p-3 sm:hidden">
        <div className="flex gap-2">
          <a href={`tel:${order.shipping.phone}`} className="flex-1">
            <Button variant="outline" className="w-full h-12 gap-2 font-bold">
              <Phone className="size-4" />
              Call
            </Button>
          </a>
          <Link
            href={`/admin/orders/${order._id}/invoice`}
            target="_blank"
            rel="noopener"
            className="flex-1"
          >
            <Button className="w-full h-12 gap-2 font-bold">
              <Printer className="size-4" />
              Print Invoice
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============ Sub Components ============ */

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  href?: string;
}

function InfoRow({
  icon,
  label,
  value,
  copyable,
  onCopy,
  copied,
  href,
}: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="text-sm leading-snug break-words">
          {href ? (
            <a
              href={href}
              className="text-foreground font-bold hover:text-primary transition-colors"
            >
              {value}
            </a>
          ) : (
            <span className="text-foreground font-bold">{value}</span>
          )}
        </div>
      </div>
      {copyable && onCopy && (
        <button
          onClick={onCopy}
          className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="size-3.5 text-green-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

interface TimelineRowProps {
  label: string;
  date: string | Date;
  danger?: boolean;
}

function TimelineRow({ label, date, danger }: TimelineRowProps) {
  const d = new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "font-bold",
          danger ? "text-red-600" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-foreground font-medium font-mono text-[11px]">
        {d}
      </span>
    </div>
  );
}