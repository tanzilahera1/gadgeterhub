import { Schema, models, model, Document } from "mongoose";
import type { ICategory } from "@/types/category";

const CategorySchema = new Schema<ICategory & Document>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category" },
    seoTitle: { type: String },
    seoDesc: { type: String },
  },
  { timestamps: true },
);


CategorySchema.index({ parent: 1 });

export default models.Category ||
  model<ICategory & Document>("Category", CategorySchema);
