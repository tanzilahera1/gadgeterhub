import type { Document, Types } from 'mongoose'
import type { Price, ItemQuantity, PaymentMethod, PaymentStatus, OrderStatus } from './index'
import type { ID } from './index'

export interface IOrderItem {
  product: ID // Product _id
  variant?: ID // ProductVariant _id
  // স্ন্যাপশট — অর্ডারের পর প্রোডাক্ট বদলালেও অর্ডার ঠিক থাকবে
  productTitle: string
  productSlug: string
  productImage: string
  unitPrice: Price
  itemQuantity: ItemQuantity
  productSku: string
}

export interface IOrderShipping {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city?: string
  district?: string
  postalCode?: string
}


export interface IOrder extends Document {
  _id: Types.ObjectId
  orderNumber: string // ORD-20260421-0001
  user?: ID // Logged-in হলে User _id, Guest হলে undefined
  items: IOrderItem[]
  shipping: IOrderShipping
  subtotal: Price
  shippingCost: Price
  discount: Price
  total: Price
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  transactionId?: string // Mobile payment TrxID
  senderNumber?: string // Mobile payment sender number
  paymentProvider?: 'bkash' | 'nagad' | 'rocket' // Selected mobile provider
  orderStatus: OrderStatus
  paidAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  customerNotes?: string
  adminNotes?: string
  couponCode?: string
  createdAt: Date
  updatedAt: Date
}
