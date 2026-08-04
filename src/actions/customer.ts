import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export interface CustomerDirectoryItem {
  phone: string;
  name: string;
  totalOrders: number;
  deliveredCount: number;
  returnedCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastAddress: string;
  tier: "VIP" | "Repeat" | "New";
}

export async function getAdminCustomersAction() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized", customers: [] };
  }

  await dbConnect();

  const orders = await Order.find()
    .select("customerPhone shipping orderStatus total createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const customerMap: Record<string, CustomerDirectoryItem> = {};

  for (const o of orders) {
    const rawPhone = o.customerPhone || o.shipping?.phone || "";
    const cleanPhone = rawPhone.trim().replace(/[^0-9]/g, "");
    if (!cleanPhone) continue;

    if (!customerMap[cleanPhone]) {
      customerMap[cleanPhone] = {
        phone: cleanPhone,
        name: o.shipping?.name || "Customer",
        totalOrders: 0,
        deliveredCount: 0,
        returnedCount: 0,
        totalSpent: 0,
        lastOrderDate: o.createdAt ? new Date(o.createdAt).toISOString() : "",
        lastAddress: [o.shipping?.addressLine1, o.shipping?.city, o.shipping?.district]
          .filter(Boolean)
          .join(", "),
        tier: "New",
      };
    }

    const c = customerMap[cleanPhone];
    c.totalOrders += 1;
    c.totalSpent += o.total || 0;
    if (o.orderStatus === "delivered") c.deliveredCount += 1;
    if (o.orderStatus === "returned") c.returnedCount += 1;
  }

  const customersList = Object.values(customerMap).map((c) => {
    c.tier = c.totalOrders >= 3 ? "VIP" : c.totalOrders >= 2 ? "Repeat" : "New";
    return c;
  });

  customersList.sort((a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent);

  return { success: true, customers: customersList };
}
