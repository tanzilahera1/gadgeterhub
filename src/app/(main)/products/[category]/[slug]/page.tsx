// src\app\(main)\products\[category]\[slug]\page.tsx
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import { formatPrice } from "@/lib/priceUtils";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { Star, Package, Info, ListChecks, ScrollText } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

import type { IProduct, IProductSpecification } from "@/types/product";
import type { ICategory } from "@/types/category";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";
import { Types } from "mongoose";

export const revalidate = 3600;
export const dynamicParams = true;

type ProductWithCategorySlug = {
  slug: string;
  category: {
    _id: Types.ObjectId;
    slug: string;
  };
};

export async function generateStaticParams() {
  await dbConnect();
  const products = await Product.find({ status: "published" })
    .select("slug category")
    .populate("category", "slug")
    .lean<ProductWithCategorySlug[]>();

  return products.map((p) => ({
    category: p.category.slug,
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, category } = await params;
  await dbConnect();
  const product = await Product.findOne({ slug }).lean<IProduct>();
  if (!product) return { title: "Product Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gadgeterhub.com";
  const productUrl = `${baseUrl}/products/${category}/${slug}`;

  return {
    title: product.seoTitle || product.title,
    description: product.seoDesc || product.shortDesc,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.seoTitle || product.title,
      description: product.seoDesc || product.shortDesc,
      url: productUrl,
      siteName: "GadgeterHub",
      images: [
        {
          url: product.thumbnail,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: "website",
    },
  };
}

type PopulatedProduct = Omit<IProduct, "category"> & {
  category: ICategory;
};

async function getProductData(slug: string) {
  await dbConnect();

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

  const displayPrice = product.salePrice || product.regularPrice;
  const hasFeatures = product.features && product.features.length > 0;
  const hasSpecs =
    product.specifications && product.specifications.length > 0;

  // JSON-LD Generation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gadgeterhub.com";
  const productUrl = `${baseUrl}/products/${params.category}/${product.slug}`;
  
  const brandName = typeof product.brand === "object" && product.brand && "name" in product.brand 
    ? String((product.brand as Record<string, unknown>).name)
    : typeof product.brand === "string" && product.brand 
    ? product.brand 
    : "GadgeterHub";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": [product.thumbnail, ...(product.images?.map(i => i.url) || [])],
    "description": product.shortDesc,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": brandName
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "BDT",
      "price": displayPrice,
      "availability": product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "GadgeterHub"
      }
    },
    ...(product.ratings?.count && product.ratings.count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.ratings.average || 5,
        "reviewCount": product.ratings.count
      }
    } : {})
  };

  return (
    // ✅ overflow-x-hidden দিয়ে root level এ ক্ল্যাম্প
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-5 sm:space-y-6">
        {/* ==================== Breadcrumbs ==================== */}
        <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href="/" className="hover:text-primary shrink-0">
            Home
          </Link>
          <span className="shrink-0">/</span>
          <Link href="/products" className="hover:text-primary shrink-0">
            Products
          </Link>
          <span className="shrink-0">/</span>
          <span className="text-foreground font-bold truncate">
            {product.category.name}
          </span>
        </nav>

        {/* ==================== Main Section ==================== */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 lg:gap-12">
          {/* Image */}
          <div className="min-w-0">
            <ProductImageGallery images={product.images || []} />
          </div>

          {/* Info */}
          <div className="space-y-5 min-w-0">
            {/* Header */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-bold tracking-widest rounded">
                  Official
                </span>

                <div className="flex items-center gap-1 text-xs">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold">
                    {product.ratings?.average || 4.8}
                  </span>
                  <span className="text-muted-foreground">
                    ({product.ratings?.count || 12})
                  </span>
                </div>
              </div>

              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black leading-tight break-words">
                {product.title}
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed break-words">
                {product.shortDesc}
              </p>
            </div>

            {/* 💰 Pricing — Mobile Optimized */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
                {formatPrice(displayPrice)}
              </span>

              {product.salePrice && (
                <span className="text-muted-foreground text-xs sm:text-sm tracking-wider line-through">
                  {formatPrice(product.regularPrice)}
                </span>
              )}

              {product.salePrice && (
                <span className="text-xs sm:text-base font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded">
                  বাঁচবে {formatPrice(product.regularPrice - product.salePrice)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t">
              <ProductActions
                productId={String(product._id)}
                productTitle={product.title}
                stock={product.stockQuantity}
                product={product}
              />
            </div>
          </div>
        </div>

        {/* ==================== Features, Description & Specs ==================== */}
        <div className="pt-8 sm:pt-10 border-t space-y-8 sm:space-y-10">
          {/* ── Features Section ── */}
          {hasFeatures && (
            <section className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                <div className="flex items-center justify-center size-8 sm:size-9 rounded-lg bg-primary/10 shrink-0">
                  <ListChecks className="size-4 sm:size-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  মূল বৈশিষ্ট্যসমূহ
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {product.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors min-w-0"
                  >
                    <span className="flex items-center justify-center size-5 sm:size-6 rounded-full bg-emerald-100 text-emerald-600 text-[10px] sm:text-xs font-black shrink-0 mt-0.5 dark:bg-emerald-500/20 dark:text-emerald-400">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-snug break-words min-w-0">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Description & Specs Grid ── */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Description — 2/3 */}
            <div className="lg:col-span-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                <div className="flex items-center justify-center size-8 sm:size-9 rounded-lg bg-blue-500/10 shrink-0">
                  <ScrollText className="size-4 sm:size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  বিস্তারিত বিবরণ
                </h2>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 lg:p-7 overflow-hidden">
                <div
                  className="prose prose-sm max-w-none break-words
                    prose-headings:font-black prose-headings:text-foreground prose-headings:border-b prose-headings:border-border/40 prose-headings:pb-2 prose-headings:mb-3
                    prose-h3:text-sm sm:prose-h3:text-base prose-h3:mt-6 first:prose-h3:mt-0
                    prose-h4:text-xs sm:prose-h4:text-sm prose-h4:mt-5
                    prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3 prose-p:text-sm
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-ul:space-y-1.5 prose-ul:my-3 prose-ul:pl-5
                    prose-li:text-muted-foreground prose-li:leading-relaxed prose-li:text-sm
                    prose-li:marker:text-primary
                    dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>

            {/* Specifications — 1/3 */}
            {hasSpecs && (
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                  <div className="flex items-center justify-center size-8 sm:size-9 rounded-lg bg-amber-500/10 shrink-0">
                    <Info className="size-4 sm:size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black">
                    স্পেসিফিকেশন
                  </h2>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden lg:sticky lg:top-20">
                  {product.specifications.map(
                    (spec: IProductSpecification, idx: number) => (
                      <div
                        key={idx}
                        className={`flex flex-col gap-0.5 px-3 sm:px-4 py-2.5 sm:py-3 text-sm min-w-0 ${
                          idx % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                        } ${
                          idx !== product.specifications.length - 1
                            ? "border-b border-border/30"
                            : ""
                        }`}
                      >
                        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground break-words">
                          {spec.key}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-foreground break-words">
                          {spec.value}
                        </span>
                      </div>
                    ),
                  )}

                  {/* Stock Status */}
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/30 border-t border-border/30">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      স্টক স্ট্যাটাস
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Package className="size-4 text-emerald-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 break-words">
                        {product.stockQuantity > 0
                          ? `স্টকে আছে (${product.stockQuantity} পিস)`
                          : "স্টক শেষ"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== Related Products ==================== */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4 pt-8 sm:pt-10">
            <h2 className="text-lg sm:text-xl font-black">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p: IProduct) => (
                <ProductCard key={String(p._id)} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}