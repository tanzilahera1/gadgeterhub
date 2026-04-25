import mongoose, { Schema, models, model, Document } from "mongoose";
import type { ICart } from "@/types/cart";

const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId },
    itemQuantity: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CartSchema = new Schema<ICart & Document>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String }, // For guest users
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

CartSchema.index({ user: 1 });
CartSchema.index({ sessionId: 1 });
// Auto-delete Guest Cart after 30 days
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export default models.Cart || model<ICart & Document>("Cart", CartSchema);
