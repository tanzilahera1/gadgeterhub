import { MetadataRoute } from "next";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { Types } from "mongoose";

type PopulatedProduct = {
  _id: Types.ObjectId;
  slug: string;
  updatedAt: Date;
  category: {
    _id: Types.ObjectId;
    slug: string;
  };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gadgeterhub.com";

  // Static SEO routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-info`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    await dbConnect();

    // Fetch Categories
    // Assuming you want to index /products/[category]
    const categories = await Category.find({}).select("slug updatedAt").lean();
    
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/products/${category.slug}`,
      lastModified: category.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    // Fetch Published Products
    // Generating /products/[categorySlug]/[productSlug]
    const products = await Product.find({ status: "published" })
      .select("slug category updatedAt")
      .populate("category", "slug")
      .lean();

    const productRoutes: MetadataRoute.Sitemap = (products as unknown as PopulatedProduct[])
      .filter((product) => product.category && product.category.slug) // Ensure populated
      .map((product) => ({
        url: `${baseUrl}/products/${product.category.slug}/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    // Fallback to static routes if DB fails
    return staticRoutes;
  }
}
