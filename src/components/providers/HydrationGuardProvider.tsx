"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HydrationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-0 space-y-0 animate-in fade-in duration-700">
        {/* Navbar Skeleton - Matches NavbarClient (h-12) */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-card/40 backdrop-blur-xl h-12 border-b border-border/10">
          <div className="container mx-auto flex h-full items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-md hidden sm:block" />
            </div>
            <div className="hidden lg:flex gap-6">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        <div className="pt-12">
          {/* Hero Section Skeleton - Matches HeroSection Layout */}
          <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-10 items-center">
            <div className="space-y-6 w-full lg:w-1/2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-12 md:h-16 w-full md:w-3/4 rounded-2xl" />
                <Skeleton className="h-12 md:h-16 w-2/3 rounded-2xl" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
              </div>
              <div className="flex gap-4 pt-6">
                <Skeleton className="h-12 w-32 md:w-40 rounded-xl" />
                <Skeleton className="h-12 w-28 md:w-32 rounded-xl" />
              </div>
            </div>
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative h-[300px] w-[300px] md:h-[450px] md:w-[450px]">
                <Skeleton className="h-full w-full rounded-3xl" />
              </div>
            </div>
          </div>

          {/* Product Grid Skeleton - Matches HomeProductGrid */}
          <div className="container mx-auto px-4 pt-8 md:pt-16 pb-20">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                 <Skeleton className="h-6 w-6 rounded-md" />
                 <Skeleton className="h-8 w-40 rounded-lg" />
               </div>
               <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="space-y-4 rounded-2xl border border-border/50 p-3 md:p-4 bg-card/10"
                >
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
