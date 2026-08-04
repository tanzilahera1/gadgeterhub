// src/app/admin/orders/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { OrderDetailsClient } from "./OrderDetailsClient";
import type { IOrderSerializable } from "@/types/order";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Order Details",
};

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;

  await dbConnect();
  const [orderDoc, productsDocs] = await Promise.all([
    Order.findById(id).lean(),
    Product.find().select("_id title thumbnail colors sizes salePrice regularPrice weight").sort({ title: 1 }).lean(),
  ]);

  if (!orderDoc) {
    notFound();
  }

  const order = JSON.parse(JSON.stringify(orderDoc)) as IOrderSerializable;
  const products = JSON.parse(JSON.stringify(productsDocs));

  return <OrderDetailsClient order={order} products={products} />;
}