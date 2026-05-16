import Link from "next/link";
import {
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { dbConnect } from "@/lib/db";
import { formatPrice } from "@/lib/priceUtils";
import { IOrder } from "@/types/order";

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
    .limit(5)
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

  const STATS_CARDS = [
    {
      label: "Total Sales",
      value: formatPrice(stats.totalSales),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "+12%",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "+5%",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: stats.pendingOrders > 0 ? "Action Needed" : "All Clear",
    },
    {
      label: "Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "Inventory",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Dashboard Overview
        </h2>
        <p className="text-slate-500 font-medium">
          Welcome back, Admin. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div
              className={cn(
                "absolute top-0 right-0 size-24 opacity-[0.03] group-hover:scale-110 transition-transform",
                card.color,
              )}
            >
              <card.icon className="size-full" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "size-12 rounded-2xl flex items-center justify-center",
                  card.bg,
                  card.color,
                )}
              >
                <card.icon className="size-6" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 text-slate-500",
                )}
              >
                {card.trend}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {card.label}
              </p>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity or Placeholder */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Recent Activity
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-primary hover:underline"
            >
              View All Orders
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="pb-4">Order</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Total</th>
                      <th className="pb-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.recentOrders.map((order: IOrder) => (
                      <tr
                        key={order._id?.toString()}
                        className="group transition-colors hover:bg-slate-50/50"
                      >
                        <td className="py-4">
                          <Link
                            href={`/admin/orders/${order._id?.toString()}`}
                            className="text-xs font-mono font-black text-slate-900 hover:text-primary"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-bold text-slate-900">
                            {order.shipping.name}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-black text-slate-900">
                            {formatPrice(order.total)}
                          </p>
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase px-2 py-1 rounded-md",
                              order.orderStatus === "pending"
                                ? "bg-amber-100 text-amber-600"
                                : order.orderStatus === "delivered"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-blue-100 text-blue-600",
                            )}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <ShoppingCart className="size-12 mb-4 opacity-20" />
                <p className="font-bold text-sm">No recent orders yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
          <h3 className="text-lg font-black tracking-tight mb-6">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
              <span className="font-bold text-sm">Add New Product</span>
              <ArrowUpRight className="size-4 opacity-40 group-hover:opacity-100 transition-all" />
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
              <span className="font-bold text-sm">Create Coupon</span>
              <ArrowUpRight className="size-4 opacity-40 group-hover:opacity-100 transition-all" />
            </button>
            <button className="w-full bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between opacity-50 cursor-not-allowed">
              <span className="font-bold text-sm">System Update</span>
              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-700 px-2 py-1 rounded-md">
                V2.4
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
