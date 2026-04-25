// src/components/products/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star, Minus, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, calculateDiscount } from "@/lib/priceUtils";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

// Type Imports
import type { IProduct } from "@/types/product";
import type { ICartItem, IPopulatedCartItem } from "@/types/cart";
import { ICategory } from "@/types/category";

export default function ProductCard({ product }: { product: IProduct }) {
  const {
    cart,
    addToCart,
    updateQty,
    removeItem,
    isAdding,
    isUpdating,
    isRemoving,
  } = useCart();

  // Price calculations
  const discountPercentage = calculateDiscount(
    product.regularPrice,
    product.salePrice,
  );
  const displayPrice = product.salePrice || product.regularPrice;

  // Type Guards for slug routing
  const getCategorySlug = (): string => {
    const cat = product.category;

    // চেক করছি cat একটি অবজেক্ট কিনা এবং তার মধ্যে 'slug' প্রপার্টি আছে কিনা
    if (typeof cat === "object" && cat !== null && "slug" in cat) {
      // এখানে আমরা Next.js/TypeScript কে বলছি, "হ্যাঁ, আমি শিওর এটা ICategory"
      return (cat as ICategory).slug;
    }

    return "uncategorized";
  };

  const productHref = `/products/${getCategorySlug()}/${product.slug}`;

  // Cart Matcher Logic
  const cartItem = cart?.items?.find((item: ICartItem | IPopulatedCartItem) => {
    const itemProductId =
      typeof item.product === "object" &&
      item.product !== null &&
      "_id" in item.product
        ? String(item.product._id)
        : String(item.product);
    return itemProductId === String(product._id);
  });

  const isInCart = !!cartItem;
  const currentQty = cartItem?.itemQuantity || 0;
  const isActionPending = isAdding || isUpdating || isRemoving;

  // Handlers
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stockQuantity === 0) return toast.error("স্টক নেই!");

    addToCart(
      { productId: String(product._id), quantity: 1 },
      {
        onSuccess: () => {
          toast.success(`${product.title} কার্টে যোগ করা হয়েছে!`, {
            icon: <ShoppingCart className="size-4" />,
          });
        },
      },
    );
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentQty < product.stockQuantity) {
      updateQty({
        productId: String(product._id),
        quantity: currentQty + 1,
      });
    } else {
      toast.error(`সর্বোচ্চ স্টক লিমিট ${product.stockQuantity} টি`);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentQty > 1) {
      updateQty({
        productId: String(product._id),
        quantity: currentQty - 1,
      });
    } else {
      removeItem(
        { productId: String(product._id) },
        {
          onSuccess: () => toast.info("কার্ট থেকে রিমুভ করা হয়েছে"),
        },
      );
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl  bg-card glass-border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* 1. Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/20 rounded-t-xl">
        <Link href={productHref} className="absolute inset-0 z-0 block">
          <Image
            src={product.thumbnail} 
            alt={product.title}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Top Overlay Gradient */}
        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/40 to-transparent z-0" />

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute left-3 top-3 z-10 px-2.5 py-1 rounded-full bg-amber-500 text-[11px] font-extrabold text-black shadow-lg">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toast.success("Wishlist এ যোগ করা হয়েছে!");
          }}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/50 text-foreground/70 transition-colors hover:text-destructive"
        >
          <Heart className="size-4" />
        </button>

        {/* Out of Stock Overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Badge
              variant="destructive"
              className="px-4 py-1.5 text-sm font-medium tracking-wide shadow-xl"
            >
              স্টক শেষ
            </Badge>
          </div>
        )}
      </div>

      {/* 2. Content Container */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        
        <div className="mb-4 flex flex-1 flex-col">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <Link href={productHref} className="flex-1">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                {product.title}
              </h3>
            </Link>

            {/* Rating right beside title */}
            <div className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              <span>{product.ratings?.average || "0.0"}</span>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {product.shortDesc}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="mt-auto flex items-end justify-between gap-2">
          {/* Price Stack */}
          <div className="flex flex-col gap-0.5">
            {/* ✅ FIX 2: চিকন লাল দাগ (decoration-[1px] এবং অপাসিটি কমানো হয়েছে) */}
            {discountPercentage > 0 ? (
              <span className="  text-muted-foreground line-through decoration-destructive/70 decoration tracking-widest">
                {formatPrice(product.regularPrice)}
              </span> 
            ) : (
              <span className="h-4"></span>
            )}
            <span className="text-2xl  font-black leading-none tracking-tight text-foreground">
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Dynamic Action Area */}
          <div className="relative z-10 flex min-w-27.5 shrink-0 justify-end">
            {!isInCart ? (
              /* ✅ FIX 1: টেক্সট কালার text-white dark:text-black দেওয়া হয়েছে */
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0 || isActionPending}
                className="flex h-9.5  items-center justify-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 dark:text-black"
              >
                {isActionPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShoppingCart className="size-4 shrink-0" />
                )}
                <span>কার্টে যোগ করুন</span>
              </button>
            ) : (
              /* State 2: Quantity Selector */
              <div className="flex h-9.5 w-27.5 items-center justify-between rounded-full bg-secondary/50 px-1 border border-border/50">
                <button
                  onClick={handleDecrease}
                  disabled={isActionPending}
                  className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-background/80 disabled:opacity-50"
                >
                  <Minus className="size-4" />
                </button>

                <span className="w-4 text-center text-sm font-bold tabular-nums">
                  {isActionPending ? (
                    <Loader2 className="mx-auto size-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    currentQty
                  )}
                </span>

                <button
                  onClick={handleIncrease}
                  disabled={
                    currentQty >= product.stockQuantity || isActionPending
                  }
                  className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-background/80 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
