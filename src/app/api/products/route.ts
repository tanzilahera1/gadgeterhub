// src/app/api/products/route.ts
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import type { IProduct } from "@/types/product";
import type { ICategory } from "@/types/category";
import type { FilterQuery } from "mongoose";
import { NextResponse } from "next/server";

// টাইপ এরর ফিক্স করার জন্য Populated টাইপ
type PopulatedProductDoc = Omit<IProduct, "category"> & {
  category: ICategory;
  _id: unknown;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort");

    await dbConnect();

    const query: FilterQuery<IProduct> = { status: "published" };

    if (category) {
      const cat = await Category.findOne({ slug: category }).lean<{
        _id: unknown;
      }>();
      if (cat) query.category = cat._id;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDesc: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortQuery: Record<string, 1 | -1> | undefined = undefined;
    if (sort === "price-asc") sortQuery = { price: 1 };
    if (sort === "price-desc") sortQuery = { price: -1 };
    if (sort === "newest") sortQuery = { createdAt: -1 };

    let mongoQuery = Product.find(query).populate("category", "name slug");
    if (sortQuery) {
      mongoQuery = mongoQuery.sort(sortQuery);
    }

    const limitParam = searchParams.get("limit");
    if (limitParam) {
      const limitVal = parseInt(limitParam, 10);
      if (!isNaN(limitVal) && limitVal > 0) {
        mongoQuery = mongoQuery.limit(limitVal);
      }
    }

    const productsDocs = await mongoQuery.lean();

    // Safe mapping without any
    const products = (productsDocs as unknown as PopulatedProductDoc[]).map(
      (p) => ({
        ...p,
        _id: String(p._id),
        category: {
          ...p.category,
          _id: String(p.category._id),
        },
      }),
    );

    return NextResponse.json(products);
  } catch (error) {
    console.error("API Products Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
