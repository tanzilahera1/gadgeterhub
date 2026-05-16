import Link from "next/link";
import Order from "@/models/Order";
import { dbConnect } from "@/lib/db";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import { Search, Filter, Eye, ShoppingCart, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { IOrder } from "@/types/order";

export const dynamic = "force-dynamic";

async function getOrders(): Promise<IOrder[]> {
  await dbConnect();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Orders Management
          </h2>
          <p className="text-slate-500 font-medium">
            Track and manage all customer purchases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500">
            <AlertCircle className="size-4 text-amber-500" />
            <span>
              {orders.filter((o) => o.orderStatus === "pending").length} Pending
              Orders
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID or Name..."
            className="w-full pl-10 pr-4 h-11 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-11 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
            <Filter className="size-3.5" />
            Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-11 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
            Export Data
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Order ID
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Customer
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Payment
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => {
                return (
                  <tr
                    key={order._id?.toString()}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span className="text-xs font-mono font-black text-slate-900">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 leading-none">
                          {order.shipping.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {order.shipping.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-600">
                        {format(new Date(order.createdAt!), "dd MMM, yyyy")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {format(new Date(order.createdAt!), "hh:mm a")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        {formatPrice(order.total)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                            order.paymentMethod === "cod"
                              ? "bg-slate-100 border-slate-200 text-slate-600"
                              : "bg-primary/5 border-primary/20 text-primary",
                          )}
                        >
                          {order.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusUpdater
                        orderId={order._id.toString()}
                        currentStatus={order.orderStatus || "pending"}
                      />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/admin/orders/${order._id?.toString()}`}>
                        <button className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all group-hover:scale-110 shadow-sm">
                          <Eye className="size-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <ShoppingCart className="size-16" />
                      <p className="font-black text-xl uppercase tracking-widest">
                        No Orders Yet
                      </p>
                    </div>
                  </td>
                </tr>
              )}  
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            Showing {orders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-slate-50 text-[10px] font-black uppercase text-slate-400 disabled:opacity-50"
              disabled
            >
              Prev
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-slate-50 text-[10px] font-black uppercase text-slate-400 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
