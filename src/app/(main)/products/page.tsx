// src/app/(main)/products/page.tsx
import { Suspense } from "react";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { ProductsPageContent } from "@/components/products/ProductsPageContent";
import Footer from "@/components/layout/Footer";

import type { IProduct } from "@/types/product";
import type { ICategory } from "@/types/category";

export const revalidate = 3600;

async function getInitialData() {
  await dbConnect();

  const productsDocs = await Product.find({ status: "published" })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const categoriesDocs = await Category.find().lean<ICategory[]>();

  const products = (productsDocs as unknown as (Omit<IProduct, 'category'> & { category: ICategory })[]).map((p) => ({
    ...p,
    _id: String(p._id),
    category: {
      ...p.category,
      _id: String(p.category._id),
    },
  })) as IProduct[];

  const categories = categoriesDocs.map((c) => ({
    ...c,
    _id: String(c._id),
  })) as ICategory[];

  return { products, categories };
}

export default async function ProductsPage() {
  const { products, categories } = await getInitialData();

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-4">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <ProductsPageContent
            initialProducts={products}
            initialCategories={categories}
          />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
