// src/app/(admin)/admin/products/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { redirect } from "next/navigation";
import { AdminProductsAntdClient } from "@/components/admin/AdminProductsAntdClient";
import type { IProduct } from "@/types/product";

export const metadata = {
  title: "Products Directory | Admin",
};

async function getProductsData() {
  await dbConnect();
  Category.init();

  const [products, categories] = await Promise.all([
    Product.find()
      .populate({ path: "category", select: "name slug" })
      .sort({ createdAt: -1 })
      .lean(),
    Category.find().select("_id name slug").sort({ name: 1 }).lean(),
  ]);

  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    categories: JSON.parse(JSON.stringify(categories)),
  };
}

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const { products, categories } = await getProductsData();

  return <AdminProductsAntdClient products={products} categories={categories} />;
}
