import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gadgeterhub.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/cart/",
        "/checkout/",
        "/api/",
        "/wishlist/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
