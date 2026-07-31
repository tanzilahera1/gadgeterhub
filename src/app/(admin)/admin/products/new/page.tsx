// src/app/(admin)/admin/products/new/page.tsx
import ProductForm from "./ProductForm";
import Category from "@/models/Category";
import { dbConnect } from "@/lib/db";

export const metadata = {
  title: "Add New Product | Admin",
  description: "Create a new product listing in your store.",
};

async function getCategories() {
  await dbConnect();
  const categories = await Category.find().select("_id name").sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return <ProductForm categories={categories} />;
}
