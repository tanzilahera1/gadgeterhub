// src/app/(main)/products/[category]/page.tsx
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { IProduct } from "@/types/product";
import { ICategory } from "@/types/category";
import { notFound } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { Search } from "lucide-react";
import { FilterQuery, Types } from "mongoose";
import Footer from "@/components/layout/Footer";

// ✅ যোগ করো
export const revalidate = 3600; // 1 ঘন্টা পর রিবিল্ড
export const dynamicParams = true; // নতুন ক্যাটাগরি আসলে 404 না, on-demand বানাবে

// ✅ Build টাইমে সব ক্যাটাগরির পেজ বানাও
export async function generateStaticParams() {
  await dbConnect();
  const categories = await Category.find().select('slug').lean();
  return categories.map((cat) => ({
    category: cat.slug,
  }));
}

// ✅ টাইপ ডিফাইন
type LeanProduct = Omit<IProduct, "_id"> & { _id: Types.ObjectId };
type LeanCategory = Omit<ICategory, "_id"> & { _id: Types.ObjectId };

async function getCategoryData(slug: string) {
  await dbConnect();

  const category = await Category.findOne({ slug }).lean<LeanCategory>();
  if (!category) return null;

  const products = await Product.find({
    category: category._id, // ✅ any বাদ
    status: "published",
  } as FilterQuery<IProduct>)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean<LeanProduct[]>();

  // ✅ _id string এ কনভার্ট
  return {
    category: {
      ...category,
      _id: category._id.toString(),
    } as ICategory,
    products: products.map((p) => ({
      ...p,
      _id: p._id.toString(),
      category:
        typeof p.category === "object" &&
        p.category !== null &&
        "_id" in p.category
          ? { ...p.category, _id: p.category._id.toString() }
          : p.category,
    })) as IProduct[],
  };
}

export default async function CategoryListingPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string }>;
}) {
  const params = await paramsPromise;
  const data = await getCategoryData(params.category);

  if (!data) notFound();

  const { products } = data;

  return (
    <section className="max-w-7xl mx-auto px-4  py-4">
      {/* ✅ সাইডবার বাদ - শুধু কনটেন্ট */}

      {/* Product Grid - 4 কলাম */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ">
          {products.map((product) => (
            <ProductCard key={product._id.toString()} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Search className="size-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            No products in this category
          </h3>
          <p className="text-slate-500 font-medium italic text-sm">
            Check back soon for new arrivals.
          </p>
        </div>
      )}

      <div className="mt-20">
        <Footer />
      </div>
    </section>
  );
}
