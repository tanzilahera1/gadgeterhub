// ==================== src/types/product.ts ====================
import { ICategory } from './category'
import type { ID, Price, StockQuantity, ProductStatus } from './index'

export interface IProductVariantAttribute {
  attributeName: string // 'Color', 'Size', 'Storage'
  attributeValue: string // 'Red', 'XL', '256GB'
}

export interface IProductVariant {
  variantSku: string
  variantTitle: string // 'Red - XL', '256GB - Silver'
  regularPrice: Price
  salePrice?: Price
  stockQuantity: StockQuantity
  variantImages: string[]
  variantAttributes: IProductVariantAttribute[]
}

export interface IProductImage {
  url: string
  alt: string
  order: number
}

export interface IProductSpecification {
  key: string
  value: string 
}

export interface IProduct { 
  _id: ID
  // Core — Required
   category: ID | ICategory
  title: string
  slug: string
  sku: string
  shortDesc: string // কার্ডে দেখানোর জন্য (max 160 char)
  description: string // ডিটেইল পেজ HTML
  regularPrice: Price
  salePrice?: Price
  costPrice?: Price
  stockQuantity: StockQuantity
  thumbnail: string
  images: IProductImage[]
 
  status: ProductStatus

  // Relations — Optional
  brand?: ID // Brand _id

  // Inventory — Optional
  variants: IProductVariant[]
  supplier?: string // 'গুলিস্থান', 'নিউ মার্কেট'

  // Shipping — Optional
  weight?: number // grams

  // SEO — Optional
  seoTitle?: string
  seoDesc?: string // max 160 char
  tags: string[]
  features: string[]
  specifications: IProductSpecification[]

  // Admin Control — Homepage flags
  featured: boolean
  trending: boolean
  bestseller: boolean

  // Stats
  ratings: {
    average: number
    count: number
  }

  createdAt: Date
  updatedAt: Date
}
