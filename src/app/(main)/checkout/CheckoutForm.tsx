"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { createOrder } from "@/actions/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Banknote,
  ShieldCheck,
  Truck,
  ArrowRight,
  Check,
  Copy,
  PackageCheck,
  Gift,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/priceUtils";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IPopulatedCartItem } from "@/types/cart";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

const CheckoutSchema = z
  .object({
    fullName: z.string().min(3, "নাম কমপক্ষে ৩ অক্ষর হওয়া উচিত"),
    phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন"),
    addressLine1: z.string().min(5, "বিস্তারিত ঠিকানা দিন"),
    deliveryArea: z.enum(["dhaka", "outside"]),
    paymentMethod: z.enum(["cod", "mobile"]),
    paymentProvider: z.enum(["bkash", "nagad", "rocket"]).optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
    customerNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "mobile") {
        return (
          !!data.paymentProvider && !!data.senderNumber && !!data.transactionId
        );
      }
      return true;
    },
    {
      message: "মোবাইল পেমেন্টের জন্য সব তথ্য দিন",
      path: ["transactionId"],
    },
  );

type CheckoutValues = z.infer<typeof CheckoutSchema>;

interface CheckoutFormProps {
  cart: {
    items: IPopulatedCartItem[];
    total: number;
  };
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

const PAYMENT_ACCOUNTS = {
  bkash: {
    name: "bKash",
    number: "01742413416",
    logo: "/payment-method-logo/bkash.svg",
    color: "text-[#D12053]",
    bg: "bg-[#D12053]/5",
  },
  nagad: {
    name: "Nagad",
    number: "01742413416",
    logo: "/payment-method-logo/nagad.svg",
    color: "text-[#EF4136]",
    bg: "bg-[#EF4136]/5",
  },
  rocket: {
    name: "Rocket",
    number: "01742413416",
    logo: "/payment-method-logo/rocket.png",
    color: "text-[#8C3494]",
    bg: "bg-[#8C3494]/5",
  },
};

export function CheckoutForm({ cart, user }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      deliveryArea: "dhaka",
      paymentMethod: "cod",
      paymentProvider: "bkash",
    },
  });

  const deliveryArea = watch("deliveryArea");
  const paymentMethod = watch("paymentMethod");
  const paymentProvider = watch(
    "paymentProvider",
  ) as keyof typeof PAYMENT_ACCOUNTS;

  const deliveryCharge = deliveryArea === "dhaka" ? 60 : 120;
  const grandTotal = cart.total + deliveryCharge;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: CheckoutValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      formData.append(
        "district",
        data.deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka",
      );

      const result = await createOrder(formData);

      if (result && "error" in result) {
        toast.error(result.error as string);
      } else if (result && "orderNumber" in result) {
        setOrderId(result.orderNumber as string);
        setShowSuccessModal(true);
      }
    } catch {
      toast.error("কিছু ভুল হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 lg:py-12">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid lg:grid-cols-12 gap-10 items-start"
      >
        {/* Left Side: Form Sections */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          {/* 1. Delivery & Contact Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                1
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Delivery & Contact Info
              </h2>
            </div>

            <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-8 space-y-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="fullName"
                    className="font-bold flex items-center gap-1.5"
                  >
                    <span className="text-destructive">*</span> Your Name
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="e.g., John Doe"
                    className="h-14 rounded-xl border-border/60 focus:ring-primary/20 bg-background/50"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="phone"
                    className="font-bold flex items-center gap-1.5"
                  >
                    <span className="text-destructive">*</span> Your Contact
                    Number
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="01XXXXXXXXX"
                    className="h-14 rounded-xl border-border/60 focus:ring-primary/20 bg-background/50"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-3">
                  <Label
                    htmlFor="addressLine1"
                    className="font-bold flex items-center gap-1.5"
                  >
                    <span className="text-destructive">*</span> Detailed Address
                  </Label>
                  <Textarea
                    id="addressLine1"
                    {...register("addressLine1")}
                    placeholder="বাসা নং, রোড নং, এলাকা..."
                    className="min-h-[100px] rounded-xl border-border/60 focus:ring-primary/20 bg-background/50 resize-none"
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                {/* Delivery Area Selection */}
                <div className="md:col-span-2 space-y-3">
                  <Label className="font-bold flex items-center gap-1.5">
                    <span className="text-destructive">*</span> Delivery Area
                  </Label>
                  <RadioGroup
                    defaultValue="dhaka"
                    onValueChange={(val: "dhaka" | "outside") =>
                      setValue("deliveryArea", val)
                    }
                    className="grid sm:grid-cols-2 gap-4"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all cursor-pointer",
                        deliveryArea === "dhaka"
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-background/50 border-border/40 hover:border-primary/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="dhaka" id="area-dhaka" />
                        <Label
                          htmlFor="area-dhaka"
                          className="font-black cursor-pointer"
                        >
                          ঢাকার ভেতরে
                        </Label>
                      </div>
                      <span className="font-black text-primary">৳ 60</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all cursor-pointer",
                        deliveryArea === "outside"
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-background/50 border-border/40 hover:border-primary/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="outside" id="area-outside" />
                        <Label
                          htmlFor="area-outside"
                          className="font-black cursor-pointer"
                        >
                          ঢাকার বাইরে
                        </Label>
                      </div>
                      <span className="font-black text-primary">৳ 120</span>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Select Payment Method */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                2
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Select Payment Method
              </h2>
            </div>

            <RadioGroup
              defaultValue="cod"
              onValueChange={(val: "cod" | "mobile") =>
                setValue("paymentMethod", val)
              }
              className="grid gap-5"
            >
              {/* COD Option */}
              <div
                onClick={() => setValue("paymentMethod", "cod")}
                className={cn(
                  "relative transition-all duration-300 border-2 rounded-2xl overflow-hidden group cursor-pointer",
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border/40 bg-card/40 hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-5 p-6 cursor-pointer w-full">
                  <div
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                      paymentMethod === "cod"
                        ? "border-primary"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {paymentMethod === "cod" && (
                      <div className="size-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Banknote className="size-6" />
                    </div>
                    <div>
                      <p className="font-black text-lg">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        পণ্য হাতে পেয়ে টাকা দিন
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay with Mobile Banking Bar (Horizontal) */}
              <div
                onClick={() => setValue("paymentMethod", "mobile")}
                className={cn(
                  "relative transition-all duration-300 border-2 rounded-xl overflow-hidden group cursor-pointer",
                  paymentMethod === "mobile"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border/40 bg-card/40 hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer w-full">
                  <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                    <div
                      className={cn(
                        "size-5 sm:size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        paymentMethod === "mobile"
                          ? "border-primary"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {paymentMethod === "mobile" && (
                        <div className="size-2.5 sm:size-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <p className="font-black text-sm sm:text-base md:text-lg truncate">
                        Pay with Mobile Banking
                      </p>

                      {/* Stacked Logos like reference */}
                      <div className="flex items-center ml-auto sm:ml-2 shrink-0 scale-75 sm:scale-100 origin-right">
                        <div className="relative size-8 sm:size-10 rounded-full border-4 border-white bg-white overflow-hidden z-30 shadow-sm">
                          <Image
                            src="/payment-method-logo/bkash.svg"
                            alt="bkash"
                            fill
                            sizes="40px"
                            className="p-1"
                          />
                        </div>
                        <div className="relative size-8 sm:size-10 rounded-full border-4 border-white bg-white overflow-hidden z-20 -ml-3 sm:-ml-4 shadow-sm">
                          <Image
                            src="/payment-method-logo/nagad.svg"
                            alt="nagad"
                            fill
                            sizes="40px"
                            className="p-1"
                          />
                        </div>
                        <div className="relative size-8 sm:size-10 rounded-full border-4 border-white bg-white overflow-hidden z-10 -ml-3 sm:-ml-4 shadow-sm">
                          <Image
                            src="/payment-method-logo/rocket.png"
                            alt="rocket"
                            fill
                            sizes="40px"
                            className="p-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center text-primary transition-transform shrink-0",
                      paymentMethod === "mobile"
                        ? "rotate-90"
                        : "group-hover:translate-x-1",
                    )}
                  >
                    <ChevronRight className="size-5 sm:size-6" />
                  </div>
                </div>
              </div>
            </RadioGroup>
          </section>

          {/* 3. Conditional Mobile Payment UI */}
          {paymentMethod === "mobile" && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 fade-in">
              <section className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                    3
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    Select Mobile Provider
                  </h2>
                </div>

                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 sm:p-8 space-y-8 shadow-sm">
                  {/* Provider List (Vertical Radios like screenshot) */}
                  <RadioGroup
                    className="grid gap-5"
                    value={paymentProvider}
                    onValueChange={(val: "bkash" | "nagad" | "rocket") =>
                      setValue("paymentProvider", val)
                    }
                  >
                    {(["bkash", "nagad", "rocket"] as const).map((p) => (
                      <div
                        key={p}
                        onClick={() => setValue("paymentProvider", p)}
                        className="flex items-center gap-4 sm:gap-6 group cursor-pointer"
                      >
                        <div
                          className={cn(
                            "size-6 sm:size-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                            paymentProvider === p
                              ? "border-primary"
                              : "border-muted-foreground/30",
                          )}
                        >
                          {paymentProvider === p && (
                            <div className="size-3 sm:size-3.5 rounded-full bg-primary shadow-sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Image
                            src={PAYMENT_ACCOUNTS[p].logo}
                            alt={p}
                            width={36}
                            height={36}
                            sizes="45px"
                            className="object-contain sm:w-[45px] sm:h-[45px]"
                          />

                          <div>
                            <p className="font-black text-lg sm:text-xl tracking-tight leading-none mb-1">
                              {PAYMENT_ACCOUNTS[p].name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                              Personal Account
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Instruction Box */}
                  <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 shadow-lg shadow-primary/5 border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          Send Money Instructions
                        </p>
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed">
                        Pay{" "}
                        <span className="text-foreground font-black">
                          {formatPrice(grandTotal)}
                        </span>{" "}
                        to this{" "}
                        <span className="text-foreground uppercase font-bold">
                          {paymentProvider || "BKASH"}
                        </span>{" "}
                        number:
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 pl-4 sm:pl-6 bg-white/50 backdrop-blur rounded-xl border border-primary/10">
                        <p
                          className={cn(
                            "text-xl sm:text-2xl md:text-3xl font-mono font-black tracking-widest",
                            PAYMENT_ACCOUNTS[paymentProvider]?.color ||
                              "text-foreground",
                          )}
                        >
                          {PAYMENT_ACCOUNTS[paymentProvider]?.number ||
                            "01XXXXXXXXX"}
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full sm:w-auto h-12 px-6 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                          onClick={() =>
                            handleCopy(
                              PAYMENT_ACCOUNTS[paymentProvider]?.number || "",
                            )
                          }
                        >
                          {copied ? (
                            <Check className="size-4 mr-2" />
                          ) : (
                            <Copy className="size-4 mr-2" />
                          )}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Metadata Fields */}
                  <div className="space-y-10">
                    <div className="relative pt-4">
                      <Separator className="bg-border/60" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] whitespace-nowrap">
                        Verify Transaction
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-2">
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="senderNumber"
                          className="text-sm font-bold flex items-center gap-1.5"
                        >
                          <span className="text-destructive">*</span> Your
                          Number (Sender)
                        </Label>
                        <Input
                          id="senderNumber"
                          {...register("senderNumber")}
                          placeholder="01XXXXXXXXX"
                          className="h-12 rounded-xl border-border/60 focus:ring-primary/20 bg-background/50 shadow-none text-sm"
                        />
                        <p className="text-[9px] text-muted-foreground font-bold uppercase ml-1">
                          যে নম্বর থেকে টাকা পাঠিয়েছেন
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="transactionId"
                          className="text-sm font-bold flex items-center gap-1.5"
                        >
                          <span className="text-destructive">*</span>{" "}
                          Transaction ID (TrxID)
                        </Label>
                        <Input
                          id="transactionId"
                          {...register("transactionId")}
                          placeholder="e.g., 9G71C8A4B2"
                          className="h-12 rounded-xl border-border/60 focus:ring-primary/20 bg-background/50 shadow-none text-sm"
                        />
                        {errors.transactionId && (
                          <p className="text-[10px] text-destructive font-medium">
                            {errors.transactionId.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Final Submit Button */}
          <div className="pt-2 animate-in fade-in duration-700">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 rounded-2xl text-lg font-black shadow-xl transition-all relative overflow-hidden group",
                isSubmitting
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-white shadow-primary/20",
              )}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin size-7" />
              ) : (
                <div className="flex items-center justify-center gap-3 w-full">
                  <Check className="size-5 transition-transform group-hover:scale-125" />
                  <span>Confirm Order</span>
                  <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1.5" />
                </div>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest leading-relaxed">
              By confirming, you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">
                Terms of Service
              </span>
            </p>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-48 bg-primary/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />

            <h2 className="text-xl font-black mb-6 pb-3 border-b border-border/40 flex items-center gap-2">
              Order Summary
            </h2>

            {/* Product List Minimal */}
            <div className="space-y-5 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex gap-3 group">
                  <div className="relative size-16 rounded-xl border border-border/40 bg-white p-1 overflow-hidden shrink-0 group-hover:border-primary/40 transition-colors shadow-sm">
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />

                    <span className="absolute -top-1 -right-1 size-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-card shadow-lg">
                      {item.itemQuantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-xs font-black line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1.5">
                      {item.product.title}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                      {formatPrice(
                        item.product.salePrice || item.product.regularPrice,
                      )}
                    </p>
                  </div>
                  <p className="text-xs font-black py-1">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="bg-border/60 mb-5" />

            <div className="space-y-4 mb-6 font-bold">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div
                className={cn(
                  "flex justify-between items-center text-[11px] p-2.5 rounded-lg",
                  deliveryArea === "dhaka"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-blue-700",
                )}
              >
                <div className="flex items-center gap-2">
                  <Truck className="size-3.5" />
                  <span>
                    Shipping (
                    {deliveryArea === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"})
                  </span>
                </div>
                <span>{formatPrice(deliveryCharge)}</span>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-black">Payable Total</span>
                <span className="text-3xl font-black text-primary tracking-tighter">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-5 mt-5 border-t border-border/40">
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-muted-foreground p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border/60 transition-colors">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <p>Secure SSL Transaction</p>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-muted-foreground p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border/60 transition-colors">
                <Check className="size-4 text-primary shrink-0" />
                <p>Manual Payment Verification</p>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-muted-foreground p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border/60 transition-colors">
                <Gift className="size-4 text-primary shrink-0" />
                <p>Official Warranty Products</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-[92vw] sm:max-w-[480px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] bg-white/95 backdrop-blur-2xl">
          <div className="relative p-7 sm:p-10 flex flex-col items-center text-center space-y-6">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary/30 via-primary to-primary/30" />
            <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce duration-1000 shadow-inner">
              <PackageCheck className="size-10" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                অর্ডার সফল হয়েছে!
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base font-medium text-slate-500 leading-relaxed max-w-[280px] sm:max-w-none">
                ধন্যবাদ! আমরা আপনার অর্ডারটি পেয়েছি।{" "}
                <br className="hidden sm:block" /> খুব শীঘ্রই আমাদের প্রতিনিধি
                কল করবেন।
              </DialogDescription>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 sm:p-7 rounded-[2rem] w-full relative group transition-colors hover:border-primary/30">
              <div className="absolute top-2 right-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-50">
                Order Number
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-primary tracking-tighter">
                {orderId}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pt-1">
              <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                <Truck className="size-5 text-primary mb-2 transition-transform group-hover:scale-110" />
                <p className="text-[10px] font-black uppercase text-slate-700">
                  24-72 ঘণ্টা
                </p>
                <p className="text-[9px] text-slate-400 font-bold">
                  ডেলিভারি সময়
                </p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                <ShieldCheck className="size-5 text-primary mb-2 transition-transform group-hover:scale-110" />
                <p className="text-[10px] font-black uppercase text-slate-700">
                  Verified
                </p>
                <p className="text-[9px] text-slate-400 font-bold">
                  সিকিউর অর্ডার
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full pt-2">
              <Link href="/" className="flex-1 order-2 sm:order-1">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  শপিং চালিয়ে যান
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1 order-1 sm:order-2">
                <Button className="w-full h-12 rounded-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                  অর্ডার ট্র্যাকিং
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
