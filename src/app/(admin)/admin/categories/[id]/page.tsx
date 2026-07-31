// src/app/(admin)/admin/categories/[id]/page.tsx
import CategoryForm from "../new/CategoryForm";
import Category from "@/models/Category";
import { dbConnect } from "@/lib/db";
import { notFound } from "next/navigation";
import { Types } from "mongoose";

export const metadata = {
  title: "Edit Category | Admin",
  description: "Update an existing product category.",
};

async function getCategoryData(id: string) {
  await dbConnect();

  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const category = await Category.findById(id).lean();
  if (!category) return null;

  return JSON.parse(JSON.stringify(category));
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const category = await getCategoryData(resolvedParams.id);

  if (!category) {
    notFound();
  }

  return <CategoryForm initialData={category} />;
}
