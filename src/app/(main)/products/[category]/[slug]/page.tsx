// src/app/(main)/products/[category]/[slug]/page.tsx
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import { formatPrice } from "@/lib/priceUtils";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { Truck, RefreshCcw, Star } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

// ✅ Type Imports
import type { IProduct, IProductSpecification } from "@/types/product";
import type { ICategory } from "@/types/category";
import Footer from "@/components/layout/Footer";

// 🛡️ Custom Type for Populated Product
type PopulatedProduct = Omit<IProduct, "category"> & {
  category: ICategory;
};

async function getProductData(slug: string) {
  await dbConnect();

  // ✅ Removed 'any', using unknown to safely cast Mongoose lean doc
  const productDoc = await Product.findOne({ slug, status: "published" })
    .populate("category", "name slug")
    .lean();

  if (!productDoc) return null;

  const product = productDoc as unknown as PopulatedProduct;

  const relatedProductsDocs = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    status: "published",
  })
    .limit(4)
    .lean();

  const relatedProducts = relatedProductsDocs as unknown as IProduct[];

  return {
    // Parsing to remove Mongoose ObjectIds and keep it pure JSON for Client Components
    product: JSON.parse(JSON.stringify(product)) as PopulatedProduct,
    relatedProducts: JSON.parse(JSON.stringify(relatedProducts)) as IProduct[],
  };
}

export default async function ProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const params = await paramsPromise;
  const data = await getProductData(params.slug);

  if (!data) notFound();

  const { product, relatedProducts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-4">
      {/* Breadcrumbs */}
      <div
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap pb-2"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>

        <span className=" text-gray-500">/</span>

        <Link href="/products" className="hover:text-primary transition-colors">
          Products
        </Link>

        <span className="text-gray-500">/</span>

        {/* text-slate-900 এর বদলে text-foreground দিলাম যাতে ডার্ক মোডেও সুন্দর দেখা যায় */}
        <span className="text-foreground font-black">
          {product.category.name}
        </span>
      </div>

      {/* Main Product Info */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Image Gallery */}
        <ProductImageGallery images={product.images || []} />

        {/* Right: Info & Actions */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                Official Listing
              </span>
              <div className="flex items-center gap-1">
                <Star className="size-3 text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-black text-slate-900">
                  {product.ratings?.average || 4.8}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  ({product.ratings?.count || 12} reviews)
                </span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {product.title}
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
              {product.shortDesc}
            </p>
          </div>

          <div className="flex items-center gap-4 py-2">
            {product.salePrice && (
              <span className="text-xl text-slate-400 line-through decoration-destructive/70 decoration tracking-widest ">
                {formatPrice(product.regularPrice)}
              </span>
            )}
            <span className="text-4xl font-black text-slate-900 translate-y-0.5">
              {formatPrice(product.salePrice || product.regularPrice)}
            </span>
            {product.salePrice && (
              <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                <span className="font-black">
                  বাঁচবে{" "}
                  <span className=" tracking-widest">
                    {formatPrice(product.regularPrice - product.salePrice)}{" "}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <ProductActions
              productId={String(product._id)}
              stock={product.stockQuantity}
            />
          </div>

          {/* Features / Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Truck className="size-5 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Fast Delivery
                </p>
                <p className="text-xs font-bold text-slate-900">24-48 Hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <RefreshCcw className="size-5 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Return Policy
                </p>
                <p className="text-xs font-bold text-slate-900">
                  7 Days Return
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specs Tabs */}
      <div className="grid md:grid-cols-3 gap-12 pt-20 border-t border-slate-100">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Product Description
            <div className="h-px flex-1 bg-slate-100" />
          </h2>
          <div
            className="prose prose-slate max-w-none prose-p:font-medium prose-headings:font-black text-slate-600"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Specifications
          </h2>
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
            {/* ✅ FIX: 'spec' এর টাইপ IProductSpecification দেওয়া হয়েছে */}
            {(product.specifications || []).map(
              (spec: IProductSpecification, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center gap-4 py-2 border-b border-slate-200 last:border-0 border-dotted"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                    {spec.key}
                  </span>
                  <span className="text-[11px] font-black text-slate-900 text-right">
                    {spec.value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8 pt-20">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Related Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* ✅ FIX: 'p' এর টাইপ IProduct দেওয়া হয়েছে */}
            {relatedProducts.map((p: IProduct) => (
              <ProductCard key={String(p._id)} product={p} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
