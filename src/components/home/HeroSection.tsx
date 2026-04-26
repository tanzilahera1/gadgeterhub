"use client";

import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { IProduct } from "@/types/product";
import { formatPrice, calculateDiscount } from "@/lib/priceUtils";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  featuredProducts: IProduct[];
}

export default function HeroSection({ featuredProducts }: HeroSectionProps) {
  const { addToCart, isAdding } = useCart();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: featuredProducts.length > 4,
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const getProductUrl = (product: IProduct) => {
    const categorySlug =
      typeof product.category === "object" && "slug" in product.category
        ? product.category.slug
        : "uncategorized";
    return `/products/${categorySlug}/${product.slug}`;
  };

  useEffect(() => {
    if (!emblaApi) return;
    const tId = setTimeout(onSelect, 0);
    emblaApi.on("select", onSelect);
    return () => {
      clearTimeout(tId);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  if (!featuredProducts?.length) return null;

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="relative group">
          {/* Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>

          {/* Carousel */}
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex -ml-2 md:-ml-4">
              {featuredProducts.map((product) => {
                const discount = calculateDiscount(
                  product.regularPrice,
                  product.salePrice,
                );

                return (
                  <Link
                    key={product.slug}
                    href={getProductUrl(product)}
                    className="flex-[0_0_70%] sm:flex-[0_0_45%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-0 pl-2 md:pl-4"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border border-border/30 shadow-sm hover:shadow-md transition-shadow">
                      {/* Image */}
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />

                      {/* Gradient */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Discount */}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded">
                          -{discount}%
                        </div>
                      )}

                      {/* Content */}
                      <div className="absolute inset-0 p-2 md:p-3 flex flex-col justify-end">
                        <div className="flex items-end justify-between gap-2">
                          {/* LEFT SIDE */}
                          <div className="flex flex-col flex-1 min-w-0">
                            {/* Desktop Title */}
                            <h3
                              className=" hidden md:block text-[11px] lg:text-sm font-medium text-white leading-tight truncate max-w-35 lg:max-w-45
"
                            >
                              {product.title}
                            </h3>

                            {/* Desktop Price */}
                            <div className="hidden md:flex items-center gap-1 mt-0.5">
                              <p className="text-[11px] lg:text-sm font-semibold text-white whitespace-nowrap">
                                {formatPrice(
                                  product.salePrice || product.regularPrice,
                                )}
                              </p>

                              {discount > 0 && (
                                <p className="text-[10px] lg:text-xs text-muted-foreground tracking-widest line-through">
                                  {formatPrice(product.regularPrice)}
                                </p>
                              )}
                            </div>

                            {/* Mobile / Tablet Price (STACKED) */}
                            <div className="md:hidden flex flex-col leading-tight">
                              <p className="text-[11px] font-semibold text-white">
                                {formatPrice(
                                  product.salePrice || product.regularPrice,
                                )}
                              </p>

                              {discount > 0 && (
                                <p className="text-[10px] text-muted-foreground tracking-widest line-through">
                                  {formatPrice(product.regularPrice)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Buy Button */}
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(
                                {
                                  productId: product._id.toString(),
                                  quantity: 1,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("Added to cart!"),
                                },
                              );
                            }}
                            className={cn(
                              "ml-auto shrink-0 h-7 md:h-8 px-2 md:px-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer",
                              isAdding && "opacity-50 pointer-events-none",
                            )}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[10px] md:text-xs font-semibold">
                              কিনুন
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dots */}
        {featuredProducts.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === selectedIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
