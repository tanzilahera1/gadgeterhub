import Order from "@/models/Order";
import Product from "@/models/Product";
import { dbConnect } from "@/lib/db";
import { IOrder } from "@/types/order";
import { AdminOrdersAntdClient } from "@/components/admin/AdminOrdersAntdClient";

export const dynamic = "force-dynamic";

async function getOrders(): Promise<IOrder[]> {
  await dbConnect();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

async function getProducts() {
  await dbConnect();
  const products = await Product.find({}, "title colors sizes salePrice regularPrice thumbnail").lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function AdminOrdersPage() {
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);

  return <AdminOrdersAntdClient orders={orders} products={products} />;
}
