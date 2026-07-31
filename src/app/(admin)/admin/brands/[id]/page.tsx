// src/app/(admin)/admin/brands/[id]/page.tsx
import BrandForm from "../new/BrandForm";
import Brand from "@/models/Brand";
import { dbConnect } from "@/lib/db";
import { notFound } from "next/navigation";
import { Types } from "mongoose";

export const metadata = {
  title: "Edit Brand | Admin",
  description: "Update an existing brand.",
};

async function getBrandData(id: string) {
  await dbConnect();
  if (!Types.ObjectId.isValid(id)) return null;
  const brand = await Brand.findById(id).lean();
  if (!brand) return null;
  return JSON.parse(JSON.stringify(brand));
}

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const brand = await getBrandData(resolvedParams.id);

  if (!brand) {
    notFound();
  }

  return <BrandForm initialData={brand} />;
}
