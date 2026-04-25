"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: string;
  stock: number;
}

export function ProductActions({ productId, stock }: ProductActionsProps) {
  const [qty, setQty] = useState(1);
  const { addToCart, isAdding } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    addToCart({ productId, quantity: qty });
    toast.success("Added to cart! 🛒", {
      description: "You can view your items in the cart sidebar.",
      action: {
        label: "Checkout",
        onClick: () => router.push("/checkout")
      }
    });
  };

  const handleBuyNow = () => {
    addToCart({ productId, quantity: qty });
    router.push("/checkout");
  };

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantity</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl size-10 hover:bg-white hover:shadow-sm"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
            >
              <Minus className="size-4 text-slate-600" />
            </Button>
            <span className="w-12 text-center font-black text-slate-900">{qty}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl size-10 hover:bg-white hover:shadow-sm"
              onClick={() => setQty(Math.min(stock, qty + 1))}
              disabled={qty >= stock}
            >
              <Plus className="size-4 text-slate-600" />
            </Button>
          </div>
          <p className="text-xs font-bold text-slate-400 italic">
            {stock > 0 ? `${stock} items in stock` : "Out of stock"}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          className="flex-1 h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
          onClick={handleAddToCart}
          disabled={isAdding || stock <= 0}
        >
          <ShoppingCart className="size-4" />
          Add to Cart
        </Button>
        <Button 
          variant="outline"
          className="flex-1 h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-xs border-2 hover:bg-slate-50 transition-all active:scale-95"
          onClick={handleBuyNow}
          disabled={isAdding || stock <= 0}
        >
          <Zap className="size-4 text-amber-500 fill-amber-500" />
          Buy Now
        </Button>
      </div>
    </div>
  );
}
