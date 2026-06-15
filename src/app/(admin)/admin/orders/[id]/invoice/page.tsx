// src/app/(admin)/admin/orders/[id]/invoice/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import { InvoiceClient } from "./InvoiceClient";
import type { IOrderSerializable } from "@/types/order";  // ✅ Serializable

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Invoice",
};

export default async function InvoicePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;

  await dbConnect();
  const orderDoc = await Order.findById(id).lean();

  if (!orderDoc) {
    notFound();
  }

  // ✅ JSON.parse(JSON.stringify(...)) → ObjectId → string, তাই IOrderSerializable
  const order = JSON.parse(JSON.stringify(orderDoc)) as IOrderSerializable;

  return <InvoiceClient order={order} />;
}