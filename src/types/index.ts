import type { Types } from "mongoose";

// Common Primitive Types

export type ID = string | Types.ObjectId;
export type Slug = string;
export type Email = string;
export type Phone = string;
export type Price = number;
export type StockQuantity = number;
export type ItemQuantity = number;

// Payment
export type PaymentMethod = "cod" | "mobile"; // bkash/nagad/rocket — UI লেভেলে
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// Order
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

// User
export type UserRole = "user" | "admin";

// Product
export type ProductStatus = "published" | "draft" | "archived";

// Coupon
export type DiscountType = "percentage" | "fixed";
