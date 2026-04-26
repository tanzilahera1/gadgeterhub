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

  // ✅ ফিক্স: featured + trending এ category.slug populate করো
  const featured = await Product.find({ featured: true, status: "published" })
    .populate("category", "slug name") // শুধু slug + name আনো
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const trending = await Product.find({ trending: true, status: "published" })
    .populate("category", "slug name") // এখানেও
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const categories = await Category.find({ parent: { $exists: false } })
    .limit(5)
    .lean();

  const categoryGrids = [];

  for (const cat of categories) {
    const catProducts = await Product.find({
      category: cat._id,
      status: "published",
    })
      .populate("category", "slug name") // ✅ এখানেও লাগবে
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (catProducts.length > 0) {
      categoryGrids.push({
        category: JSON.parse(JSON.stringify(cat)),
        products: JSON.parse(JSON.stringify(catProducts)),
      });
    }
  }

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
