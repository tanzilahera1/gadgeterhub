// src/components/home/HomeProductGrid.tsx
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { IProduct } from "@/types/product";

interface HomeProductGridProps {
  title: string;
  products: IProduct[];
  viewMoreLink?: string;
  icon?: string;
}

export default function HomeProductGrid({
  title,
  products,
  viewMoreLink,
  icon,
}: HomeProductGridProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 mt-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold drop-shadow-sm flex items-center gap-2">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-primary">
            {title}
          </span>
          {icon && <span className="text-2xl">{icon}</span>}
        </h2>
        {viewMoreLink && ( 
          <Button
            variant="ghost"
            asChild
            className="text-primary hover:text-primary/80 font-semibold group rounded-full"
          >
            <Link href={viewMoreLink}>
              View All
              <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Button> 
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
 