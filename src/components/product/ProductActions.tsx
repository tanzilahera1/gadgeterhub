// src\components\product\ProductActions.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import QuantitySelector from "@/components/products/QuantitySelector";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Truck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ICartItem, IPopulatedCartItem } from "@/types/cart";

import { WhatsAppOrderButton } from "./WhatsAppOrderButton"; 
import { IProduct } from "@/types/product"; 

interface ProductActionsProps {
  productId: string;
  productTitle: string;
  stock: number;
  product: IProduct;
}

export function ProductActions({
  productId,
  productTitle,
  stock,
  product
}: ProductActionsProps) {
  const {
    addToCart,
    isAdding,
    cart,
    updateQty,
    isUpdating,
    removeItem,
    isRemoving,
    isLoadingCart,
  } = useCart();
  const router = useRouter();

  // Selected Options (Default to first available option as requested)
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ""
  );

  // কার্টে আছে কিনা চেক করো (productId + color + size)
  const cartItem = cart?.items?.find((item: ICartItem | IPopulatedCartItem) => {
    const itemProductId =
      typeof item.product === "object" &&
      item.product !== null &&
      "_id" in item.product
        ? String(item.product._id)
        : String(item.product);

    const matchesColor = (item.color || "") === (selectedColor || "");
    const matchesSize = (item.size || "") === (selectedSize || "");

    return itemProductId === productId && matchesColor && matchesSize;
  });

  const isInCart = !!cartItem;
  const currentQtyInCart = cartItem?.itemQuantity || 0;

  // লোকাল স্টেট শুধুমাত্র তখন ব্যবহার হবে যখন প্রোডাক্ট কার্টে নেই
  const [localQty, setLocalQty] = useState(1);
  const displayQty = isInCart ? currentQtyInCart : localQty;

  const isActionPending = isAdding || isUpdating || isRemoving || isLoadingCart;
  const isDisabled = isActionPending || stock <= 0;

  const handleQtyChange = (newQty: number) => {
    if (isInCart) {
      if (newQty > currentQtyInCart) {
        updateQty({ productId, quantity: newQty, color: selectedColor, size: selectedSize });
      } else if (newQty < currentQtyInCart) {
        if (newQty === 0) {
          removeItem({ productId, color: selectedColor, size: selectedSize });
        } else {
          updateQty({ productId, quantity: newQty, color: selectedColor, size: selectedSize });
        }
      }
    } else {
      setLocalQty(newQty);
    }
  };

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info("ইতিমধ্যে এই ভ্যারিয়েন্টটি কার্টে যোগ করা হয়েছে।", {
        icon: <ShoppingCart className="size-4" />,
        duration: 1500,
      });
      return;
    }

    addToCart(
      { productId, quantity: localQty, color: selectedColor, size: selectedSize },
      {
        onSuccess: (data: { success?: boolean }) => {
          if (data?.success) {
            toast.success(`${productTitle} কার্টে যোগ করা হয়েছে!`, {
              icon: <ShoppingCart className="size-4" />,
              duration: 1500,
              action: {
                label: "চেকআউট",
                onClick: () => router.push("/cart"),
              },
            });
          }
        },
      },
    );
  };

  const handleBuyNow = () => {
    if (isInCart) {
      router.push("/checkout");
      return;
    }

    addToCart(
      { productId, quantity: localQty, color: selectedColor, size: selectedSize },
      {
        onSuccess: (data: { success?: boolean }) => {
          if (data?.success) {
            router.push("/checkout");
          }
        },
      },
    );
  };

  // Formatted Weight for UI
  const formattedWeight = product.weight
    ? product.weight < 1000
      ? `${product.weight} গ্রাম`
      : `${(product.weight / 1000).toFixed(2)} কেজি`
    : null;

  return (
    <div className="space-y-5">
      {/* Color Selection - Pill Radio Buttons */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              কালার: <span className="text-foreground font-bold font-sans capitalize">{selectedColor}</span>
            </p>
            {formattedWeight && (
              <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 border border-border/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ⚖️ {formattedWeight}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection - Pill Radio Buttons */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            সাইজ: <span className="text-foreground font-bold font-sans uppercase">{selectedSize}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback Weight Badge if no colors */}
      {(!product.colors || product.colors.length === 0) && formattedWeight && (
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
          <span>ওজন:</span>
          <span className="text-foreground flex items-center gap-1 font-bold">⚖️ {formattedWeight}</span>
        </div>
      )}
      {/* Quantity - Centralized */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          পরিমাণ{" "}
          {isInCart && (
            <span className="text-primary ml-2 lowercase font-medium">
              (কার্টে আছে)
            </span>
          )}
        </p>
        <div className="flex items-center justify-between gap-4">
          <QuantitySelector
            quantity={displayQty}
            setQuantity={handleQtyChange}
            min={isInCart ? 0 : 1}
            max={stock}
            className="h-12"
          />
          <p className="text-xs">
            {stock > 0 ? (
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full">
                {stock} স্টক আছে
              </span>
            ) : (
              <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full">
                স্টক নেই
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <Button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className={cn(
            "w-full h-12 rounded-xl text-sm font-black uppercase tracking-tight gap-2 border border-border transition-all active:scale-[0.97]",
            isInCart
              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-400"
              : "bg-muted text-foreground hover:bg-muted/70",
          )}
        >
          <ShoppingCart className="size-4 shrink-0" />
          {isInCart ? "যোগ করা হয়েছে" : "যোগ করুন"}
        </Button>

        <Button
          onClick={handleBuyNow}
          disabled={isDisabled}
          className="
            w-full h-12
            rounded-xl
            text-sm font-black uppercase tracking-tight
            gap-2
            bg-slate-950 text-white
            hover:bg-slate-800
            shadow-xl shadow-slate-950/20
            active:scale-[0.97]
            transition-all
            dark:bg-white dark:text-black dark:hover:bg-slate-200
          "
        >
          <Zap className="size-4 text-yellow-400 fill-yellow-400 shrink-0" />
          {isInCart ? "চেকআউট" : "কিনুন"}
        </Button>
      </div>

                  {/* WhatsApp অর্ডার বাটন */}
       <WhatsAppOrderButton product={product} quantity={displayQty} color={selectedColor} size={selectedSize} />

      {/* Separator */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-foreground/10"></div>
        <span className="shrink-0 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          সার্ভিস ইনফো
        </span>
        <div className="h-px flex-1 bg-foreground/10"></div>
      </div>

      {/* Trust Badges — ভার্টিক্যাল */}
      <div className="flex flex-col rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
          <Truck className="size-4 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">ডেলিভারি</p>
            <p className="text-xs font-bold">২৪–৪৮ ঘণ্টা</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
          <RefreshCcw className="size-4 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">রিটার্ন</p>
            <p className="text-xs font-bold">৭ দিন</p>
          </div>
        </div>
      </div>
    </div>
  );
}
