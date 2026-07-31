// src/app/(admin)/admin/categories/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Category from "@/models/Category";
import { redirect } from "next/navigation";
import { AdminCategoriesAntdClient } from "@/components/admin/AdminCategoriesAntdClient";
import type { ICategory } from "@/types/category";

export const metadata = {
  title: "Categories Directory | Admin",
};

async function getCategories(): Promise<ICategory[]> {
  await dbConnect();
  const categories = await Category.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export default async function AdminCategoriesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const categories = await getCategories();

  return <AdminCategoriesAntdClient categories={categories} />;
}
