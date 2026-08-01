// src/app/(main)/checkout/CheckoutForm.tsx
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { createOrder, } from "@/actions/order";
import {
  calculateShippingCost,
  getWeightTierLabel,
  DELIVERY_ZONES,
  DeliveryZone,
} from "@/lib/shipping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
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
  PackageCheck,
  User,
  CreditCard,
  Zap,
  Weight,
} from "lucide-react";
import { formatPrice } from "@/lib/priceUtils";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { IPopulatedCartItem } from "@/types/cart";
import Link from "next/link";

const CheckoutSchema = z
  .object({
    name: z.string().min(3, "নাম কমপক্ষে ৩ অক্ষর হওয়া উচিত"),
    phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন"),
    isGift: z.boolean().optional(),
    receiverName: z.string().optional(),
    receiverPhone: z.string().optional(),
    addressLine1: z.string().min(5, "বিস্তারিত ঠিকানা দিন"),
    deliveryArea: z.enum(["dhaka", "suburbs", "outside"] as const),
    paymentMethod: z.enum(["cod", "mobile"] as const),
    paymentProvider: z.enum(["bkash", "nagad", "rocket"] as const).optional(),
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
  },
  nagad: {
    name: "Nagad",
    number: "01742413416",
    logo: "/payment-method-logo/nagad.svg",
    color: "text-[#EF4136]",
  },
  rocket: {
    name: "Rocket",
    number: "01742413416",
    logo: "/payment-method-logo/rocket.png",
    color: "text-[#8C3494]",
  },
} as const;

type ProviderKey = keyof typeof PAYMENT_ACCOUNTS;

export function CheckoutForm({ cart, user }: CheckoutFormProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      isGift: false,
      receiverName: "",
      receiverPhone: "",
      deliveryArea: "dhaka",
      paymentMethod: "cod",
      paymentProvider: "bkash",
    },
  });

  // লগইন করে ফিরে আসার পর ডাটা রিস্টোর করো
  useEffect(() => {
    const savedData = sessionStorage.getItem("checkout_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof CheckoutValues, parsed[key]);
        });
        toast.success("আপনার আগের তথ্যগুলো রিস্টোর করা হয়েছে।");
      } catch (e) {
        console.error("Failed to restore checkout data", e);
      } finally {
        sessionStorage.removeItem("checkout_form_data");
      }
    }
  }, [setValue]);

  const isGift = useWatch({ control, name: "isGift" });
  const deliveryArea = useWatch({ control, name: "deliveryArea" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const paymentProvider = useWatch({
    control,
    name: "paymentProvider",
  }) as ProviderKey;

  // 📦 Total cart weight calculation (grams)
  const totalWeightGrams = cart.items.reduce((sum, item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (item.product as any)?.weight || 500;
    return sum + w * item.itemQuantity;
  }, 0);

  // 🚚 Dynamic Delivery Charge Calculation
  const deliveryCharge = calculateShippingCost(
    deliveryArea as DeliveryZone,
    totalWeightGrams,
  );
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
      (Object.keys(data) as Array<keyof CheckoutValues>).forEach((key) => {
        const value = data[key];
        if (typeof value === "boolean") {
          if (value) formData.append(key, "true");
        } else if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      const result = await createOrder(formData);
      if (result && "orderNumber" in result) {
        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
        queryClient.invalidateQueries({ queryKey: ["cart-details"] });
        router.push(`/checkout/success?order=${result.orderNumber}`);
      } else if (result && result.error) {
        toast.error(typeof result.error === "string" ? result.error : "কিছু ভুল হয়েছে, দয়া করে আবার চেষ্টা করুন।");
      }
    } catch {
      toast.error("কিছু ভুল হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      {!session && (
        <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">অর্ডারটি দ্রুত করতে চান?</h3>
            <p className="text-sm text-muted-foreground">
              Google দিয়ে লগিন করলে আপনার নাম ও ইমেইল অটো-ফিলাপ হয়ে যাবে।
            </p>
          </div>
          <Link href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 font-bold border-primary/20 hover:bg-primary/10"
            >
              <User className="size-4" />
              Google দিয়ে লগিন করুন
            </Button>
          </Link>
        </div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid lg:grid-cols-12 gap-6 lg:gap-10"
      >
        {/* Left Side: Information */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Section 1: Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="size-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-widest">
                কন্টাক্ট ইনফরমেশন
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-card/20 p-5 sm:p-7 rounded-2xl border border-border/40">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  নাম
                </Label>
                <Input
                  {...register("name")}
                  placeholder="আপনার পুরো নাম"
                  className="h-12 rounded-xl bg-background/50 text-base"
                />
                {errors.name && (
                  <p className="text-xs text-destructive font-bold">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  আপনার মোবাইল নম্বর (অর্ডার কনফার্ম করার জন্য)
                </Label>
                <Input
                  {...register("phone")}
                  placeholder="01XXXXXXXXX"
                  className="h-12 rounded-xl bg-background/50 text-base"
                />
                {errors.phone && (
                  <p className="text-xs text-destructive font-bold">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 border border-border/40 rounded-xl cursor-pointer hover:bg-card/40 transition-colors">
                  <input
                    type="checkbox"
                    {...register("isGift")}
                    className="size-5 rounded border-border/40 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-bold text-sm">
                      পার্সেলটি অন্য কেউ রিসিভ করবেন?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ডেলিভারি রিসিভারের নাম ও নম্বর আলাদা দিন
                    </p>
                  </div>
                </label>
              </div>
              {isGift && (
                <>
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      রিসিভারের নাম
                    </Label>
                    <Input
                      {...register("receiverName")}
                      placeholder="যিনি পার্সেল রিসিভ করবেন"
                      className="h-12 rounded-xl bg-background/50 text-base"
                    />
                  </div>
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      রিসিভারের মোবাইল নম্বর
                    </Label>
                    <Input
                      {...register("receiverPhone")}
                      placeholder="ডেলিভারিম্যান এই নাম্বারে কল করবে"
                      className="h-12 rounded-xl bg-background/50 text-base"
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    বিস্তারিত ঠিকানা (Full Address)
                  </Label>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    (গ্রাম/এরিয়া, থানা, জেলা)
                  </span>
                </div>
                <Textarea
                  {...register("addressLine1")}
                  placeholder="গ্রাম/এরিয়া, থানা, জেলা..."
                  className="min-h-24 rounded-xl bg-background/50 resize-none text-base p-3.5 leading-relaxed"
                />
                {errors.addressLine1 ? (
                  <p className="text-xs text-destructive font-bold">
                    {errors.addressLine1.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground ml-1">
                    দয়া করে আপনার পূর্ণাঙ্গ ঠিকানা দিন যাতে ডেলিভারিম্যান সহজেই আপনার পার্সেল পৌঁছাতে পারে।
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="size-8 sm:size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Truck className="size-4 sm:size-5" />
                </div>
                <h2 className="text-sm sm:text-lg font-black uppercase tracking-widest">
                  ডেলিভারি এরিয়া
                </h2>
              </div>
              <div className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-700 shrink-0">
                <span>ওজন: {totalWeightGrams}g ({getWeightTierLabel(totalWeightGrams)})</span>
              </div>
            </div>

            <RadioGroup
              onValueChange={(v: DeliveryZone) =>
                setValue("deliveryArea", v)
              }
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch"
            >
              {[
                {
                  id: "dhaka" as const,
                  label: "ঢাকার ভেতর (ISD)",
                  sub: "Inside Dhaka City",
                  price: calculateShippingCost("dhaka", totalWeightGrams),
                },
                {
                  id: "suburbs" as const,
                  label: "উপ-শহর (SUB)",
                  sub: "গাজীপুর, সাভার, নারায়নগঞ্জ, কেরানীগঞ্জ",
                  price: calculateShippingCost("suburbs", totalWeightGrams),
                },
                {
                  id: "outside" as const,
                  label: "ঢাকার বাইরে (OSD)",
                  sub: "Outside Dhaka (All Districts)",
                  price: calculateShippingCost("outside", totalWeightGrams),
                },
              ].map((area) => (
                <div
                  key={area.id}
                  onClick={() => setValue("deliveryArea", area.id)}
                  className={cn(
                    "relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
                    deliveryArea === area.id
                      ? "border-primary bg-primary/3 ring-1 ring-primary/20 shadow-sm"
                      : "border-border/40 bg-card/20 hover:border-primary/20",
                  )}
                >
                  {deliveryArea === area.id && (
                    <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-bl-xl shadow-md animate-in fade-in zoom-in duration-300">
                      <Check className="size-3.5 stroke-[4px]" />
                    </div>
                  )}

                  {/* Row 1: Top Header (Title + Price) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          deliveryArea === area.id
                            ? "border-primary"
                            : "border-muted-foreground/30",
                        )}
                      >
                        <div
                          className={cn(
                            "size-2.5 rounded-full bg-primary transition-all",
                            deliveryArea === area.id ? "scale-100" : "scale-0",
                          )}
                        />
                      </div>
                      <p className="font-bold text-sm leading-tight truncate">
                        {area.label}
                      </p>
                    </div>
                    <span className="text-base font-black text-primary shrink-0">
                      ৳{area.price}
                    </span>
                  </div>

                  {/* Row 2: Bottom Row (1 Column Full-Width Card Footer Subtitle) */}
                  <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] font-medium text-muted-foreground leading-snug text-center">
                    {area.sub}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Section 3: Payment */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="size-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-widest">
                পেমেন্ট মেথড
              </h2>
            </div>
            <div className="grid gap-4">
              {/* COD */}
              <div
                onClick={() => setValue("paymentMethod", "cod")}
                className={cn(
                  "relative flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer overflow-hidden group",
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/3"
                    : "border-border/40 bg-card/40 hover:border-primary/20",
                )}
              >
                {paymentMethod === "cod" && (
                  <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-bl-xl shadow-md">
                    <Check className="size-3.5 stroke-[4px]" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Banknote
                    className={cn(
                      "size-6",
                      paymentMethod === "cod"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="leading-tight">
                    <p className="font-bold text-base">ক্যাশ অন ডেলিভারি</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                      পণ্য হাতে পেয়ে টাকা দিন
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Banking */}
              <div
                onClick={() => setValue("paymentMethod", "mobile")}
                className={cn(
                  "relative flex items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer w-full",
                  paymentMethod === "mobile"
                    ? "border-primary bg-primary/3"
                    : "border-border/40 bg-card/40 hover:border-primary/20",
                )}
              >
                {paymentMethod === "mobile" && (
                  <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-tr-xl rounded-bl-xl shadow-md z-10">
                    <Check className="size-3.5 stroke-[4px]" />
                  </div>
                )}
                <Zap
                  className={cn(
                    "size-6 shrink-0",
                    paymentMethod === "mobile"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="font-bold text-base flex-1 min-w-0 truncate">
                  মোবাইল ব্যাংকিং
                </span>
                <div className="flex shrink-0 -space-x-2 pr-4">
                  {["bkash", "nagad", "rocket"].map((p) => (
                    <div
                      key={p}
                      className="relative size-10 rounded-full bg-white shadow-sm ring-2 ring-white overflow-hidden flex items-center justify-center"
                    >
                      <Image
                        src={`/payment-method-logo/${p}.${p === "rocket" ? "png" : "svg"}`}
                        alt={p}
                        fill
                        className="object-contain p-1.5"
                        sizes="40px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Provider Selection UI */}
          {paymentMethod === "mobile" && (
            <div className="animate-in slide-in-from-top-2 duration-300 rounded-2xl bg-primary/2 border border-primary/20 p-6 space-y-7">
              <RadioGroup className="grid grid-cols-3 gap-3">
                {(["bkash", "nagad", "rocket"] as const).map((p) => (
                  <div
                    key={p}
                    onClick={() => setValue("paymentProvider", p)}
                    className={cn(
                      "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer bg-white",
                      paymentProvider === p
                        ? "border-primary shadow-md scale-105"
                        : "border-border/40 grayscale opacity-60 hover:grayscale-0 hover:opacity-100",
                    )}
                  >
                    {paymentProvider === p && (
                      <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-tr-xl rounded-bl-xl">
                        <Check className="size-3 stroke-[4px]" />
                      </div>
                    )}
                    <div className="relative size-12 mb-2">
                      <Image
                        src={PAYMENT_ACCOUNTS[p].logo}
                        alt={p}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">
                      {p}
                    </p>
                  </div>
                ))}
              </RadioGroup>

              <div className="bg-white rounded-2xl p-6 border border-primary/10 space-y-4 shadow-sm">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Send Money (Personal)
                  </p>
                  <p className="text-sm font-medium">
                    নিচের নাম্বারে{" "}
                    <span className="font-black text-foreground">
                      {formatPrice(grandTotal)}
                    </span>{" "}
                    সেন্ড মানি করুন:
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 group overflow-hidden">
                  <p
                    className={cn(
                      "text-lg sm:text-2xl font-mono font-black tracking-wide min-w-0 truncate",
                      PAYMENT_ACCOUNTS[paymentProvider]?.color,
                    )}
                  >
                    {PAYMENT_ACCOUNTS[paymentProvider]?.number}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      handleCopy(PAYMENT_ACCOUNTS[paymentProvider].number)
                    }
                    className="shrink-0 h-9 px-4 rounded-lg text-xs font-black uppercase tracking-wider"
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">
                    আপনার নম্বর
                  </Label>
                  <Input
                    {...register("senderNumber")}
                    placeholder="01XXXXXXXXX"
                    className="h-12 rounded-xl text-base"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium ml-1">
                    যে নাম্বার থেকে টাকা পাঠিয়েছেন
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">
                    Transaction ID (TrxID)
                  </Label>
                  <Input
                    {...register("transactionId")}
                    placeholder="8N7X2W..."
                    className="h-12 rounded-xl text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ✅ Customer Notes — moved here from nowhere, was missing */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              অতিরিক্ত নোট (ঐচ্ছিক)
            </Label>
            <Textarea
              {...register("customerNotes")}
              placeholder="ডেলিভারি সম্পর্কে বিশেষ কোনো নির্দেশনা..."
              className="min-h-20 rounded-xl bg-background/50 resize-none text-base"
            />
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-24 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6">
            <h2 className="text-base font-black uppercase tracking-widest border-b border-border/40 pb-4">
              অর্ডার সামারি
            </h2>

            <div className="space-y-5 max-h-87.5 overflow-y-auto pr-2 custom-scrollbar">
              {cart.items.map((item) => (
                <div
                  key={`${item.product._id}-${item.color || ''}-${item.size || ''}`}
                  className="flex gap-4 items-center group"
                >
                  <div className="relative size-16 rounded-xl overflow-hidden shrink-0 border border-border/40 aspect-square shadow-sm">
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-md">
                      x{item.itemQuantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                      {item.product.title}
                    </h4>
                    {(item.color || item.size) && (
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {[item.color && `কালার: ${item.color}`, item.size && `সাইজ: ${item.size}`].filter(Boolean).join(" | ")}
                      </p>
                    )}
                    <p className="text-xs font-black text-primary mt-1">
                      {formatPrice(
                        item.product.salePrice || item.product.regularPrice,
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-black">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-foreground/3 p-5 rounded-2xl border border-border/20 space-y-4">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>সাবটোটাল</span>
                <span className="text-foreground">
                  {formatPrice(cart.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>ডেলিভারি চার্জ</span>
                <span className="text-foreground">
                  + {formatPrice(deliveryCharge)}
                </span>
              </div>
              <Separator className="bg-border/20" />
              <div className="flex justify-between items-end pt-1">
                <span className="text-xs font-black uppercase text-primary tracking-widest">
                  সর্বমোট
                </span>
                <span className="text-3xl font-black text-primary tracking-tighter leading-none">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin size-6" />
              ) : (
                <div className="flex items-center gap-2">
                  <span>অর্ডার কনফার্ম করুন</span>
                  <ArrowRight className="size-5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              )}
            </Button>

            <div className="flex justify-center gap-6 py-2 opacity-40">
              <ShieldCheck className="size-5" />
              <Truck className="size-5" />
              <PackageCheck className="size-5" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}