
"use server";
import { z } from "zod";

import Order from "@/models/Order";
import Product from "@/models/Product";
import Cart from "@/models/Cart";
import { sendMetaEvent, getFbCookies } from "@/lib/meta-capi";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { IProduct } from "@/types/product";
import type { Document } from "mongoose";
import { dbConnect } from "@/lib/db";
import { sendDiscordOrder } from "@/lib/discord";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  calculateShippingCost,
  DELIVERY_ZONES,
  DeliveryZone,
} from "@/lib/shipping";
import { buildInvoiceText } from "@/lib/invoice-formatter";

import { generateInvoiceNumber } from "@/lib/invoice-number";
import { ChannelSource, CHANNEL_LABELS } from "@/types/order";

const CreateOrderSchema = z
  .object({
    name: z.string().min(3, "নাম কমপক্ষে 3 অক্ষর"),
    phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন"),
    isGift: z.boolean().optional(),
    receiverName: z.string().optional(),
    receiverPhone: z.string().optional(),
    addressLine1: z.string().min(5, "ঠিকানা কমপক্ষে 5 অক্ষর"),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    postalCode: z.string().optional(),
    deliveryArea: z.enum(["dhaka", "suburbs", "outside"]),
    paymentMethod: z.enum(["cod", "mobile"]),
    paymentProvider: z.enum(["bkash", "nagad", "rocket"]).optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
    customerNotes: z.string().optional(),
  })
  .refine( 
    (data) => {
      if (data.paymentMethod === "mobile") {
        return (
          !!data.paymentProvider && !!data.senderNumber && !!data.transactionId
        );
      }
      return true;
    },
    {
      message: "মোবাইল পেমেন্টের জন্য সব তথ্য দিন",
      path: ["transactionId"],
    },
  );



export async function createOrder(formData: FormData) {
  const session = await auth();
  await dbConnect();

  const validated = CreateOrderSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    isGift: formData.get("isGift") === "true",
    receiverName: formData.get("receiverName") || undefined,
    receiverPhone: formData.get("receiverPhone") || undefined,
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city") || undefined,
    district: (formData.get("district") as string) || undefined,
    postalCode: formData.get("postalCode") || undefined,
    deliveryArea: formData.get("deliveryArea"),
    paymentMethod: formData.get("paymentMethod"),
    paymentProvider: formData.get("paymentProvider") || undefined,
    senderNumber: formData.get("senderNumber") || undefined,
    transactionId: formData.get("transactionId") || undefined,
    customerNotes: formData.get("customerNotes") || undefined,
  });

  if (!validated.success) {
    console.error("Order Validation Error:", validated.error.flatten().fieldErrors);
    return { error: "দয়া করে ফর্মের সব তথ্য সঠিকভাবে পূরণ করুন।" };
  }

  const data = validated.data;

  const userId = session?.user?.id;
  const cookieStore = await cookies();
  const guestSessionId = cookieStore.get("cart_session_id")?.value;

  const cart = await Cart.findOne(
    userId ? { user: userId } : { sessionId: guestSessionId },
  ).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return { error: { cart: ["কার্ট খালি"] } };
  }

  let subtotal = 0;
  const orderItems = [];

  let totalWeightGrams = 0;
  for (const item of cart.items) {
    const product = item.product as IProduct & Document;
    if (!product || product.status !== "published") {
      return {
        error: {
          cart: [`${product?.title || "প্রোডাক্ট"} এখন আর পাওয়া যাচ্ছে না`],
        },
      };
    }

    if (product.stockQuantity < item.itemQuantity) {
      return {
        error: {
          cart: [
            `${product.title} স্টকে মাত্র ${product.stockQuantity}টি আছে`,
          ],
        },
      };
    }

    const unitPrice = product.salePrice || product.regularPrice;
    subtotal += unitPrice * item.itemQuantity;
    totalWeightGrams += (product.weight || 500) * item.itemQuantity;

    orderItems.push({
      product: product._id,
      variant: item.variant,
      color: item.color,
      size: item.size,
      productTitle: product.title,
      productSlug: product.slug,
      productImage: product.thumbnail,
      unitPrice,
      itemQuantity: item.itemQuantity,
      productSku: product.sku,
    });
  }

  const shippingCost = calculateShippingCost(
    data.deliveryArea as DeliveryZone,
    totalWeightGrams,
  );
  const total = subtotal + shippingCost;

  // Channel source & brand code
  const channelSource = (formData.get("channelSource") as ChannelSource) || "web";
  const brandCode = (formData.get("brandCode") as string) || "GH";

  const orderNumber = await generateInvoiceNumber(channelSource, brandCode);

  const shippingName =
    data.isGift && data.receiverName ? data.receiverName : data.name;
  const shippingPhone =
    data.isGift && data.receiverPhone ? data.receiverPhone : data.phone;
  const deliveryZone = DELIVERY_ZONES[data.deliveryArea as DeliveryZone]?.badgeLabel || "ISD (Inside Dhaka)";

  const order = await Order.create({
    orderNumber,
    brandCode,
    channelSource,
    user: userId || undefined,
    customerPhone: data.phone,
    items: orderItems,
    shipping: {
      name: shippingName,
      phone: shippingPhone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      district: data.district,
      postalCode: data.postalCode,
      deliveryZone,
      deliveryArea: data.deliveryArea,
    },
    subtotal,
    shippingCost,
    totalWeightGrams,
    discount: 0,
    total,
    paymentMethod: data.paymentMethod,
    paymentStatus: "pending",
    paymentProvider: data.paymentProvider || undefined,
    senderNumber: data.senderNumber || undefined,
    transactionId: data.transactionId || undefined,
    orderStatus: "pending",
    customerNotes: data.customerNotes,
  });

  // ✅ Send Notifications — Discord & Telegram (both use invoice format)
  try {
    // Discord — invoice format ভেতরে handle হচ্ছে
    await sendDiscordOrder(order, data.name);

  const invoiceText = buildInvoiceText(order, { customerName: data.name });
  const telegramMsg =
    `🛍️ *নতুন অর্ডার এসেছে!*\n` +
    "```\n" +
    invoiceText +
    "\n```";

  await sendTelegramMessage(telegramMsg);
} catch (err) {
  console.error("Failed to send order notifications:", err);
}

  // Stock decrement
  for (const item of cart.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stockQuantity: -item.itemQuantity } },
    );
  }

  // Cart cleanup
  await Cart.deleteOne({ _id: cart._id });
  if (guestSessionId) cookieStore.delete("cart_session_id");

  // Meta CAPI Purchase event
  const fbCookies = await getFbCookies();

  await sendMetaEvent({
    eventName: "Purchase",
    eventID: order.orderNumber,
    sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    userData: {
      email: session?.user?.email || undefined,
      phone: data.phone,
      fbp: fbCookies.fbp,
      fbc: fbCookies.fbc,
      ct: data.city,
      st: data.district,
      zp: data.postalCode,
      country: "bd",
    },
    customData: {
      value: total,
      currency: "BDT",
      content_ids: orderItems.map((i) => i.productSku),
      content_type: "product",
      num_items: orderItems.reduce((sum, i) => sum + i.itemQuantity, 0),
      order_id: orderNumber,
    },
  });

  revalidatePath("/dashboard/orders");
  return { orderNumber };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await dbConnect();
  const order = await Order.findById(orderId);
  if (!order) return { error: "Order not found" };

  order.orderStatus = status;

  if (status === "shipped") order.shippedAt = new Date();
  if (status === "delivered") {
    order.deliveredAt = new Date();
    // COD হলে delivered = paid auto
    if (order.paymentMethod === "cod") order.paymentStatus = "paid";
  }
  if (status === "cancelled") order.cancelledAt = new Date();

  await order.save();

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export interface AdminManualOrderItemInput {
  productId: string;
  color?: string;
  size?: string;
  quantity: number;
}

export interface AdminManualOrderInput {
  name: string;
  phone: string;
  isGift?: boolean;
  receiverName?: string;
  receiverPhone?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  deliveryArea: DeliveryZone;
  paymentMethod: "cod" | "mobile";
  paymentProvider?: "bkash" | "nagad" | "rocket";
  senderNumber?: string;
  transactionId?: string;
  customerNotes?: string;
  channelSource: ChannelSource;
  items: AdminManualOrderItemInput[];
}

export async function createAdminManualOrder(data: AdminManualOrderInput) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  await dbConnect();

  if (!data.items || data.items.length === 0) {
    return { error: "কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করুন" };
  }

  let subtotal = 0;
  let totalWeightGrams = 0;
  const orderItems = [];

  for (const item of data.items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return { error: "প্রোডাক্ট পাওয়া যায়নি" };
    }

    const unitPrice = product.salePrice || product.regularPrice;
    subtotal += unitPrice * item.quantity;
    totalWeightGrams += (product.weight || 500) * item.quantity;

    orderItems.push({
      product: product._id,
      color: item.color || undefined,
      size: item.size || undefined,
      productTitle: product.title,
      productSlug: product.slug,
      productImage: product.thumbnail,
      unitPrice,
      itemQuantity: item.quantity,
      productSku: product.sku,
    });
  }

  const shippingCost = calculateShippingCost(data.deliveryArea, totalWeightGrams);
  const total = subtotal + shippingCost;
  const deliveryZone = DELIVERY_ZONES[data.deliveryArea]?.badgeLabel || "ISD (Inside Dhaka)";

  const channelSource = data.channelSource || "web";
  const brandCode = "GH";
  const orderNumber = await generateInvoiceNumber(channelSource, brandCode);

  const shippingName =
    data.isGift && data.receiverName ? data.receiverName : data.name;
  const shippingPhone =
    data.isGift && data.receiverPhone ? data.receiverPhone : data.phone;

  const order = await Order.create({
    orderNumber,
    brandCode,
    channelSource,
    customerPhone: data.phone,
    items: orderItems,
    shipping: {
      name: shippingName,
      phone: shippingPhone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      district: data.district,
      deliveryZone,
      deliveryArea: data.deliveryArea,
    },
    subtotal,
    shippingCost,
    totalWeightGrams,
    discount: 0,
    total,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentMethod === "mobile" ? "paid" : "pending",
    paymentProvider: data.paymentProvider || undefined,
    senderNumber: data.senderNumber || undefined,
    transactionId: data.transactionId || undefined,
    orderStatus: "pending",
    customerNotes: data.customerNotes,
  });

  try {
    await sendDiscordOrder(order, data.name);
    const invoiceText = buildInvoiceText(order, { customerName: data.name });
    await sendTelegramMessage(
      `🛍️ *নতুন ম্যানুয়াল অর্ডার এসেছে (${CHANNEL_LABELS[channelSource] || channelSource})!*\n` +
        "```\n" +
        invoiceText +
        "\n```",
    );
  } catch (err) {
    console.error("Error sending order notifications:", err);
  }

  revalidatePath("/admin/orders");
  return { success: true, orderNumber: order.orderNumber };
}