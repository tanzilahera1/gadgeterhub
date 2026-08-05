// src/app/(admin)/admin/courier/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import { redirect } from "next/navigation";
import { CourierMonitorClient } from "./CourierMonitorClient";
import type { IOrderSerializable } from "@/types/order";

export const metadata = {
  title: "Pathao Courier Monitor | Admin",
};

async function getCourierOrders(): Promise<IOrderSerializable[]> {
  await dbConnect();
  const orders = await Order.find({
    courierTrackingId: { $exists: true, $ne: "" },
  })
    .sort({ updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(orders));
}

export default async function CourierMonitorPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const orders = await getCourierOrders();

  return <CourierMonitorClient initialOrders={orders} />;
}
