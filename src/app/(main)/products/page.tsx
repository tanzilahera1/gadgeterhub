// src/app/(main)/products/page.tsx
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { SearchX, PackageX } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import Footer from "@/components/layout/Footer";

// ✅ Type Imports (No 'any')
import type { IProduct } from "@/types/product";
import type { ICategory } from "@/types/category";
import type { FilterQuery } from "mongoose";

// ✅ FIX: 빌্ড এরর সমাধান করতে
export const dynamic = "force-dynamic";

interface SearchParams {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  [key: string]: string | undefined;
}

// 🛡️ Populated Document Types
type PopulatedProductDoc = Omit<IProduct, "category"> & {
  category: ICategory;
};

async function getProducts(searchParams: SearchParams) {
  await dbConnect();

  const query: FilterQuery<IProduct> = { status: "published" };

  if (searchParams.category) {
    const cat = await Category.findOne({
      slug: searchParams.category,
    }).lean<{ _id: string }>();

    if (cat) query.category = cat._id;
  }

  if (searchParams.search) {
    query.$or = [
      { title: { $regex: searchParams.search, $options: "i" } },
      { shortDesc: { $regex: searchParams.search, $options: "i" } },
      { tags: { $in: [new RegExp(searchParams.search, "i")] } },
    ];
  }

  const productsDocs = await Product.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const categoriesDocs = await Category.find().lean();

  // Serialization mapping safely
  const products = (productsDocs as unknown as PopulatedProductDoc[]).map(
    (p) => ({
      ...p,
      _id: String(p._id),
      category: {
        ...p.category,
        _id: String(p.category._id),
      },
    }),
  );

  const categories = (categoriesDocs as unknown as ICategory[]).map((c) => ({
    ...c,
    _id: String(c._id),
  }));

  return { products, categories };
}

export default async function ProductsPage({
  searchParams: searchParamsPromise,
  isSearchRoute = false, // ✅ Search page থেকে আসলে এটা true হবে
}: {
  searchParams: Promise<SearchParams>;
  isSearchRoute?: boolean;
}) {
  const searchParams = await searchParamsPromise;
  const { products, categories } = await getProducts(searchParams);

  const currentCategory = categories.find(
    (c) => c.slug === searchParams.category,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Category Title (শুধু প্রোডাক্টস পেজের জন্য) */}
      {!isSearchRoute && currentCategory && (
        <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {currentCategory.name}
          </h1>
          <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">
            {products.length} products found
          </p>
        </div>
      )}

      {/* Product Grid or Empty State */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-1000">
          {products.map((product) => (
            <ProductCard
              key={String(product._id)}
              product={product as unknown as IProduct}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* 🌟 Super Premium Empty State */}
          <div className="size-28 bg-card/60 backdrop-blur-xl border border-border/40 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/5 relative">
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
            {searchParams.search ? (
              <SearchX className="size-12 text-muted-foreground" />
            ) : (
              <PackageX className="size-12 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {searchParams.search ? "কোনো প্রোডাক্ট পাওয়া যায়নি" : "স্টক খালি"}
            </h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              {searchParams.search
                ? `আমরা "${searchParams.search}" এর জন্য কোনো প্রোডাক্ট খুঁজে পাইনি। দয়া করে বানান চেক করুন অথবা অন্য কিওয়ার্ড দিয়ে খুঁজুন।`
                : "এই ক্যাটাগরিতে এই মুহূর্তে কোনো প্রোডাক্ট নেই। খুব শিগগিরই নতুন কালেকশন যুক্ত হবে!"}
            </p>
          </div>
        </div>
      )}

      {/* Search Route থেকে কল হলে Footer ডাবল দেখানোর দরকার নেই */}
      {!isSearchRoute && (
        <div className="mt-24">
          <Footer />
        </div>
      )}
    </div>
  );
}
