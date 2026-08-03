import Product from "@/models/Product";
import Order from "@/models/Order";
import { dbConnect } from "@/lib/db";
import { AdminDashboardAntdClient } from "@/components/admin/AdminDashboardAntdClient";

export const dynamic = "force-dynamic";

async function getStats() {
  await dbConnect();

  const [totalOrders, totalProducts, pendingOrders, salesAgg, recentOrders] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

  const totalSales = salesAgg[0]?.total || 0;

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
