import type { Document, Types } from "mongoose";
import type {
  Price,
  ItemQuantity,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from "./index";
import type { ID } from "./index";

export interface IOrderItem {
  product: ID;
  variant?: ID;
  color?: string;
  size?: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
  unitPrice: Price;
  itemQuantity: ItemQuantity;
  productSku: string;
}

import type { DeliveryZone } from "@/lib/shipping";

export interface IOrderShipping {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  deliveryZone?: string;
  deliveryArea?: DeliveryZone;
}

export type ChannelSource =
  | "web"
  | "facebook_page"
  | "facebook_marketplace"
  | "instagram"
  | "whatsapp"
  | "threads"
  | "google"
  | "offline"
  | "quora";

export const CHANNEL_PREFIXES: Record<ChannelSource, string> = {
  web: "WEB",
  facebook_page: "FBP",
  facebook_marketplace: "FBM",
  instagram: "IG",
  whatsapp: "WA",
  threads: "TH",
  google: "GOOG",
  offline: "OFF",
  quora: "QR",
};

export const CHANNEL_LABELS: Record<ChannelSource, string> = {
  web: "Website",
  facebook_page: "Facebook Page",
  facebook_marketplace: "FB Marketplace",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  threads: "Threads",
  google: "Google",
  offline: "Off Line",
  quora: "Quora",
};

export interface IOrderBase {
  orderNumber: string;
  brandCode?: string;
  channelSource?: ChannelSource;
  user?: ID;
  customerPhone: string; // The primary contact number for the order
  items: IOrderItem[];
  shipping: IOrderShipping;
  subtotal: Price;
  shippingCost: Price;
  totalWeightGrams?: number;
  discount: Price;
  vipPrivilege?: Price;
  advancePaid?: Price;
  purchaseCost?: Price;
  courierCodFee?: Price;
  total: Price;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  senderNumber?: string;
  paymentProvider?: "bkash" | "nagad" | "rocket";
  orderStatus: OrderStatus;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  customerNotes?: string;
  adminNotes?: string;
  couponCode?: string;
  courierTrackingId?: string;
  courierStatus?: string;
  courierReason?: string;
  courierRiderName?: string;
  courierRiderPhone?: string;
  courierLastUpdated?: string;
  courierAttemptCount?: number;
}

export interface IOrder extends IOrderBase, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderSerializable extends IOrderBase {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
