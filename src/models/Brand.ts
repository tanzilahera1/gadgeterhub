import mongoose, { Schema, models, model, Document } from 'mongoose'
import type { IBrand } from '@/types/brand'

const BrandSchema = new Schema<IBrand & Document>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    logo: { type: String },
    description: { type: String },
  },
  { timestamps: true }
)

BrandSchema.index({ slug: 1 })

export default models.Brand || model<IBrand & Document>('Brand', BrandSchema)
