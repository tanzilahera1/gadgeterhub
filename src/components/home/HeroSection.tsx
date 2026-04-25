// src/components/home/HeroSection.tsx
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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // হেল্পার ফাংশন বানাও
  const getProductUrl = (product: IProduct) => {
    const categorySlug =
      typeof product.category === "object" && "slug" in product.category
        ? product.category.slug
        : "uncategorized"; // fallback
    return `/products/${categorySlug}/${product.slug}`;
  };

  useEffect(() => {
    if (!emblaApi) return;
    const tId = setTimeout(() => {
      onSelect();
    }, 0);
    emblaApi.on("select", onSelect);
    return () => {
      clearTimeout(tId);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        {/* Relative wrapper */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 shadow-lg hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>

          {/* Carousel Container */}
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
                    className="flex-[0_0_40%] md:flex-[0_0_calc(25%)] min-w-0 pl-2 md:pl-4 group/card"
                  >
                    {/* Card Container */}
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md bg-card border border-border/30 shadow-sm hover:shadow-md transition-shadow">
                      {/* Image */}
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                        priority={featuredProducts.indexOf(product) < 4}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity" />

                      {/* Discount Badge - Top Left for Conversion */}
                      {discount > 0 && (
                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-red-600/90 backdrop-blur-md text-white text-[9px] md:text-[12px] font-bold px-1.5 py-0.5 rounded-sm shadow-md z-10 flex items-center">
                          -{discount}%
                        </div>
                      )}

                      {/* Content */}
                      <div className="absolute inset-0 p-2 md:p-3 flex flex-col justify-end">
                        <div className="flex items-end justify-between gap-1.5 md:gap-2">
                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] sm:text-sm md:text-lg  text-white leading-tight mb-0.5 md:mb-1 line-clamp-1 drop-shadow-md">
                              {product.title}
                            </h3>
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] sm:text-sm md:text-base  text-white drop-shadow-md">
                                {formatPrice(
                                  product.salePrice || product.regularPrice,
                                )}
                              </p>
                              {discount > 0 && (
                                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-300  drop-shadow-sm translate-y-px line-through not-first:decoration-destructive/70 decoration tracking-widest">
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
                              "shrink-0 h-6 w-auto px-2.5 md:h-8 md:px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform active:scale-95 flex items-center justify-center p-0 cursor-pointer",
                              isAdding && "opacity-50 pointer-events-none",
                            )}
                          >
                            <ShoppingCart className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                            <span className="text-[10px] md:text-xs font-bold leading-none">
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

        {/* Dots Navigation */}
        {featuredProducts.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
