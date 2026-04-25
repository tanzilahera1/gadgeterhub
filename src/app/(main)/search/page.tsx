// src/app/(main)/search/page.tsx
import { Suspense } from "react";
import ProductsPage from "../products/page";
import { Search, Loader2 } from "lucide-react";

// ✅ FIX: বিল্ড এরর (Suspense Bailout) দূর করতে এটি ডাইনামিক রেন্ডারিং ফোর্স করবে
export const dynamic = "force-dynamic";

interface SearchParams {
  category?: string;
  search?: string;
  [key: string]: string | undefined;
}

export default async function SearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const query = searchParams.search || "";

  return (
    <div className="min-h-screen bg-background">
      {/* 🌟 Super Premium Search Header */}
      <div className="bg-card/40 backdrop-blur-xl border-b border-border/40 py-16 md:py-20 relative overflow-hidden">
        {/* Glowing Background Effect */}
        <div className="absolute top-0 right-1/4 size-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 size-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="size-16 rounded-3xl bg-card border border-border/60 shadow-xl shadow-primary/5 flex items-center justify-center mb-6">
            <Search className="size-7 text-primary" />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">
            Search Results
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {query ? (
              <>
                Showing results for{" "}
                <span className="text-primary">&quot;{query}&quot;</span>
              </>
            ) : (
              "Browse All Products"
            )}
          </h1>

          <p className="text-muted-foreground mt-4 font-medium max-w-md text-sm md:text-base leading-relaxed">
            খুঁজে নিন আপনার পছন্দের গ্যাজেট, স্মার্টফোন এবং প্রিমিয়াম এক্সেসরিজ
            আমাদের বিশাল কালেকশন থেকে।
          </p>
        </div>
      </div>

      {/* 🌟 Products Grid with Suspense Loading */}
      <div className="-mt-6 relative z-20">
        <Suspense
          fallback={
            <div className="py-32 flex flex-col items-center justify-center text-primary">
              <Loader2 className="size-10 animate-spin mb-4" />
              <p className="font-bold text-sm tracking-widest uppercase">
                Loading Results...
              </p>
            </div>
          }
        >
          <ProductsPage
            searchParams={searchParamsPromise}
            isSearchRoute={true}
          />
        </Suspense>
      </div>
    </div>
  );
}
