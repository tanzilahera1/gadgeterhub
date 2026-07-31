import Product from "@/models/Product";
import Order from "@/models/Order";
import { dbConnect } from "@/lib/db";
import { AdminDashboardAntdClient } from "@/components/admin/AdminDashboardAntdClient";

export const dynamic = "force-dynamic";

async function getStats() {
  await dbConnect();
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });

  const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });
  const totalSales = orders.reduce((acc, order) => acc + (order.total || 0), 0);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    totalOrders,
    totalProducts,
    pendingOrders,
    totalSales,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return <AdminDashboardAntdClient stats={stats} />;
}
