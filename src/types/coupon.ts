// ==================== src/types/coupon.ts ====================
import type { Price, DiscountType } from './index'

export interface ICoupon {
  code: string // Uppercase, unique
  discountType: DiscountType // 'percentage' | 'fixed'
  discountValue: number // 10 মানে ১০% বা ৳১০
  minAmount?: Price // কমপক্ষে কত টাকার অর্ডারে প্রযোজ্য
  maxDiscount?: Price // percentage কুপনে সর্বোচ্চ ছাড়
  usageLimit?: number // মোট কতবার ব্যবহার করা যাবে
  usedCount: number
  validFrom: Date
  validUntil: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
