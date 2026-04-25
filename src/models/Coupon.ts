import mongoose, { Schema, models, model, Document } from 'mongoose'
import type { ICoupon } from '@/types/coupon'

const CouponSchema = new Schema<ICoupon & Document>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // Useful for percentage discounts
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CouponSchema.index({ code: 1 })
CouponSchema.index({ isActive: 1 })

export default models.Coupon || model<ICoupon & Document>('Coupon', CouponSchema)
