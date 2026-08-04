import Product from "@/models/Product";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import { dbConnect } from "@/lib/db";
import { AdminDashboardAntdClient } from "@/components/admin/AdminDashboardAntdClient";

export const dynamic = "force-dynamic";

async function getStats() {
  await dbConnect();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalOrders, totalProducts, pendingOrders, salesAgg, recentOrders, profitAgg, todayAgg] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
      // Net profit: Revenue - Shipping COGS (we approximate using order data)
      Order.aggregate([
        { $match: { orderStatus: { $in: ["processing", "shipped", "delivered"] } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$total" },
            shippingCost: { $sum: "$shippingCost" },
            codFees: { $sum: { $ifNull: ["$courierCodFee", 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, orderStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
    ]);

  const totalSales = salesAgg[0]?.total || 0;

  // Fetch total ad spend from Expense records
  const expensesAgg = await Expense.aggregate([
    { $match: { type: "ad_spend" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalAdSpend = expensesAgg[0]?.total || 0;

  // Rough net profit = all active-order revenue - ad spend - courier COD fees
  const profData = profitAgg[0];
  const grossRevenue = profData?.revenue || 0;
  const totalCodFees = profData?.codFees || 0;
  const netProfit = Math.max(0, grossRevenue - totalAdSpend - totalCodFees);

  const todayRevenue = todayAgg[0]?.total || 0;
  const todayOrders = todayAgg[0]?.count || 0;

  return {
    totalOrders,
    totalProducts,
    pendingOrders,
    totalSales,
    netProfit,
    totalAdSpend,
    todayRevenue,
    todayOrders,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return <AdminDashboardAntdClient stats={stats} />;
}
