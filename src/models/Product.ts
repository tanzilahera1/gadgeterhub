import { Schema, models, model, Document } from "mongoose";
import type { IProduct } from "@/types/product";

const ProductVariantAttributeSchema = new Schema(
  {
    attributeName: { type: String, required: true },
    attributeValue: { type: String, required: true },
  },
  { _id: false },
);

const ProductVariantSchema = new Schema(
  {
    variantSku: { type: String, required: true },
    variantTitle: { type: String, required: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    variantImages: [{ type: String }],
    variantAttributes: [ProductVariantAttributeSchema],
  },
  { _id: true },
);

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const ProductSpecificationSchema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct & Document>(
  {
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    shortDesc: { type: String, required: true, maxlength: 160 },
    description: { type: String, required: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    thumbnail: { type: String, required: true },
    images: { type: [ProductImageSchema], required: true },

    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "draft",
    },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    variants: { type: [ProductVariantSchema], default: [] },
    supplier: { type: String, trim: true },
    weight: { type: Number, min: 0 },
    seoTitle: { type: String },
    seoDesc: { type: String, maxlength: 160 },
    tags: [{ type: String, trim: true }],
    features: { type: [String], default: [] },
    specifications: { type: [ProductSpecificationSchema], default: [] },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);


ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: 1, status: 1 });
ProductSchema.index({ trending: 1, status: 1 });
ProductSchema.index({ bestseller: 1, status: 1 });
ProductSchema.index({
  title: "text",
  description: "text",
  sku: "text",
  tags: "text",
});
ProductSchema.index({ regularPrice: 1 });
ProductSchema.index({ salePrice: 1 });
ProductSchema.index({ "ratings.average": -1 });
ProductSchema.index({ createdAt: -1 });

export default models.Product ||
  model<IProduct & Document>("Product", ProductSchema);
