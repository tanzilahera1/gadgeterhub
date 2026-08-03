import { Suspense } from "react";
import Product from "@/models/Product";
import Category from "@/models/Category";
import HeroSection from "@/components/home/HeroSection";
import HomeProductGrid from "@/components/home/HomeProductGrid";
import { IProduct } from "@/types/product";
import Footer from "@/components/layout/Footer";
import { dbConnect } from "@/lib/db";

export const revalidate = 60; // ISR চালু

async function getHomepageData() {
  await dbConnect();

  const [featured, trending, categories] = await Promise.all([
    Product.find({ featured: true, status: "published" })
      .populate("category", "slug name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({ trending: true, status: "published" })
      .populate("category", "slug name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Category.find({ parent: { $exists: false } }).limit(5).lean(),
  ]);

  const categoryGrids = (
    await Promise.all(
      categories.map(async (cat) => {
        const catProducts = await Product.find({
          category: cat._id,
          status: "published",
        })
          .populate("category", "slug name")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        if (catProducts.length === 0) return null;

        return {
          category: JSON.parse(JSON.stringify(cat)),
          products: JSON.parse(JSON.stringify(catProducts)),
        };
      })
    )
  ).filter((grid): grid is NonNullable<typeof grid> => grid !== null);

  return {
    featuredProducts: JSON.parse(JSON.stringify(featured)) as IProduct[],
    trendingProducts: JSON.parse(JSON.stringify(trending)) as IProduct[],
    categoryGrids,
  };
}

export default async function HomePage() {
  const { featuredProducts, trendingProducts, categoryGrids } =
    await getHomepageData();

  return (
    <div className="min-h-screen pb-20">
      <Suspense
        fallback={
          <div className="h-[40vh] animate-pulse bg-muted/50 rounded-xl m-4" />
        }
      >
        {featuredProducts.length > 0 && (
          <HeroSection featuredProducts={featuredProducts} />
        )}
      </Suspense>

      {/* Trending Grid */}
      {trendingProducts.length > 0 && (
        <HomeProductGrid
          title="Trending"
          icon="🔥"
          products={trendingProducts}
          viewMoreLink="/products?sort=trending"
        />
      )}

      {/* Dynamic Category Grids */}
      {categoryGrids.map((grid) => (
        <HomeProductGrid
          key={grid.category._id}
          title={grid.category.name}
          products={grid.products}
          viewMoreLink={`/products/${grid.category.slug}`}
        />
      ))}

      <Footer />
    </div>
  );
}
