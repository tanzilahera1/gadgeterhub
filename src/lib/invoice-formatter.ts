// src/lib/invoice-formatter.ts
import type { Types } from "mongoose";
import type { IOrder } from "@/types/order";

type OrderInput = Omit<IOrder, "_id"> & { _id: Types.ObjectId };

// ✅ Optional customer info (form থেকে আসা)
type InvoiceOptions = {
  customerName?: string;
};

const padR = (s: string, len: number) =>
  s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);

const padL = (s: string, len: number) =>
  s.length >= len ? s.slice(0, len) : " ".repeat(len - s.length) + s;

const banglaNum = (n: number): string => n.toLocaleString("bn-BD");

export function buildInvoiceText(
  order: OrderInput,
  options: InvoiceOptions = {},
): string {
  const dateStr = new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const totalItems = order.items.reduce(
    (sum, item) => sum + item.itemQuantity,
    0,
  );

  const paymentLabel =
    order.paymentMethod === "cod"
      ? "COD"
      : `${order.paymentProvider?.toUpperCase() || "Mobile"}`;

  // ✅ Gift order detection
  const isGiftOrder = order.customerPhone !== order.shipping.phone;

  const header =
    `          GADGETERHUB\n` +
    `    5C(5th floor), 92/1, Motijheel C/A\n` +
    `              Dhaka-1000\n` +
    `          Mobile: 01568390014\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const orderInfo =
    `ORDER INFO\n` +
    `Order ID      : ${order.orderNumber}\n` +
    `Placed        : ${dateStr}\n` +
    `Payment Method: ${paymentLabel}\n` +
    `Total Product : ${order.items.length}\n` +
    `Total Items   : ${totalItems}`;

  // ✅ Gift order হলে customer info আলাদা সেকশন
  const customerSection = isGiftOrder
    ? `\n\n🛒 ORDER PLACED BY\n` +
      (options.customerName ? `Name  : ${options.customerName}\n` : "") +
      `Phone : ${order.customerPhone}`
    : "";

  const addr = order.shipping;

  const deliveryAddress =
    `🚚 DELIVERY ADDRESS` +
    (isGiftOrder ? ` (🎁 Gift Order)` : ``) +
    `\n` +
    `Name    : ${addr.name}\n` +
    `Phone   : ${addr.phone}\n` +
    `Address : ${addr.addressLine1}` +
    (addr.addressLine2 ? `\n          ${addr.addressLine2}` : "") +
    (addr.district ? `\n          ${addr.district}` : "") +
    (addr.city ? `, ${addr.city}` : "") +
    (addr.postalCode ? ` - ${addr.postalCode}` : "");

  const paymentInfo =
    order.paymentMethod === "mobile"
      ? `\n\nPAYMENT INFO\n` +
        `Provider: ${order.paymentProvider?.toUpperCase() || "N/A"}\n` +
        `Sender  : ${order.senderNumber || "N/A"}\n` +
        `TrxID   : ${order.transactionId || "N/A"}`
      : "";

  const COL_SN = 3;
  const COL_NAME = 26;
  const COL_QTY = 4;
  const COL_UNIT = 8;
  const COL_TOTAL = 8;

  const tableTop = `┌${"─".repeat(COL_SN + 2)}┬${"─".repeat(COL_NAME + 2)}┬${"─".repeat(COL_QTY + 2)}┬${"─".repeat(COL_UNIT + 2)}┬${"─".repeat(COL_TOTAL + 2)}┐`;

  const tableHead = `│ ${padR("SN", COL_SN)} │ ${padR("Product", COL_NAME)} │ ${padR("Qty", COL_QTY)} │ ${padR("Unit", COL_UNIT)} │ ${padR("Price", COL_TOTAL)} │`;

  const tableMid = `├${"─".repeat(COL_SN + 2)}┼${"─".repeat(COL_NAME + 2)}┼${"─".repeat(COL_QTY + 2)}┼${"─".repeat(COL_UNIT + 2)}┼${"─".repeat(COL_TOTAL + 2)}┤`;

  const tableRows = order.items
    .map((item, index) => {
      const lineTotal = item.unitPrice * item.itemQuantity;
      return (
        `│ ${padR(String(index + 1), COL_SN)} ` +
        `│ ${padR(item.productTitle, COL_NAME)} ` +
        `│ ${padL(String(item.itemQuantity), COL_QTY)} ` +
        `│ ${padL(String(item.unitPrice), COL_UNIT)} ` +
        `│ ${padL(String(lineTotal), COL_TOTAL)} │`
      );
    })
    .join("\n");

  const tableBottom = `└${"─".repeat(COL_SN + 2)}┴${"─".repeat(COL_NAME + 2)}┴${"─".repeat(COL_QTY + 2)}┴${"─".repeat(COL_UNIT + 2)}┴${"─".repeat(COL_TOTAL + 2)}┘`;

  const summaryWidth = 48;
  const summaryLine = (label: string, value: string) =>
    `${padR(label, summaryWidth - value.length)}${value}`;

  const summary =
    `${summaryLine("Subtotal", `৳${order.subtotal}`)}\n` +
    `${summaryLine("Shipping", `৳${order.shippingCost}`)}\n` +
    (order.discount > 0
      ? `${summaryLine("Discount", `-৳${order.discount}`)}\n`
      : "") +
    `${"━".repeat(summaryWidth)}\n` +
    `${summaryLine("💰 CUSTOMER PAYABLE", `৳${order.total}`)}`;

  const words = `কথায়: ${banglaNum(order.total)} টাকা মাত্র`;

  const notes = order.customerNotes
    ? `\n\n📝 CUSTOMER NOTE\n${order.customerNotes}`
    : "";

  return (
    `${header}\n\n` +
    `${orderInfo}` +
    `${customerSection}\n\n` +
    `${deliveryAddress}` +
    `${paymentInfo}\n\n` +
    `${tableTop}\n` +
    `${tableHead}\n` +
    `${tableMid}\n` +
    `${tableRows}\n` +
    `${tableBottom}\n\n` +
    `${summary}\n` +
    `${words}` +
    `${notes}`
  );
}