// src/app/(admin)/admin/finance/page.tsx
import { FinanceClient } from "./FinanceClient";
import Product from "@/models/Product";
import { dbConnect } from "@/lib/db";

export const metadata = {
  title: "Finance & Profit Analytics | Admin",
  description: "View financial summary, ROI, expenses, and winning products.",
};

export const dynamic = "force-dynamic";

async function getProducts() {
  await dbConnect();
  const products = await Product.find({ status: { $ne: "archived" } })
    .select("_id title sku")
    .sort({ title: 1 })
    .lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function AdminFinancePage() {
  const products = await getProducts();

  return <FinanceClient initialProducts={products} />;
}
