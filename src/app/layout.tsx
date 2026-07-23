
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali} from "next/font/google";
import "@/styles/globals.css";

import { Providers } from "@/components/providers/Providers";
import { ToastProvider } from "@/components/ui/toast-provider";

const notoSansfBengali = Noto_Sans_Bengali({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "bengali"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Gadgeter Hub";
const APP_DEFAULT_TITLE =
  "Gadgeter Hub | বাংলাদেশের সবচেয়ে বিশ্বস্ত গ্যাজেট শপ";
const APP_TITLE_TEMPLATE = "%s | GadgeterHub";
const APP_DESCRIPTION =
  "১০০% অরিজিনাল স্মার্টফোন, স্মার্টওয়াচ, এয়ারবাডস এবং লেটেস্ট সব গ্যাজেট কিনুন সবচেয়ে সাশ্রয়ী মূল্যে। রয়েছে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (COD) সুবিধা!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "gadget shop bangladesh",
    "buy iphone bangladesh",
    "smartphone price bd",
    "airpods price",
    "smartwatch bd",
    "gadgeterhub",
    "online gadget store",
    "mobile accessories",
    "tech shop dhaka",
    "best gadget price",
  ],
  authors: [
    { name: "GadgeterHub", url: "https://gadgeterhub.com" },
  ],
  creator: "GadgeterHub",
  publisher: "GadgeterHub",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://gadgeterhub.com",
  ),

  alternates: {
    canonical: "/",
  },

  // Open Graph - Facebook, LinkedIn, Discord
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og.png", 
        width: 512,
        height: 512,
        alt: "GadgeterHub OG Image",
      },
    ],
    locale: "en_US",
  },

  // Twitter Card 
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/logo.png"],
    creator: "@gadgeterhub", // থাকলে দাও 
  },

  // Icons - সব ডিভাইসের জন্য
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", },

    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" }, // iOS
    ],
    shortcut: ["/logo.png"],
  },

  // PWA + Mobile
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true, 
    statusBarStyle: "default",
    title: APP_NAME,
  },

  // AI/LLM friendly - Google, Perplexity, Claude যাতে বুঝে
  category: "shopping",
  classification: "E-commerce, Gadgets, Electronics, Bangladesh",

  // Verification - পরে Search Console থেকে কোড বসাবা
 verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_CENTER_VERIFICATION,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Viewport আলাদা এক্সপোর্ট - Next.js 16 রুল
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${notoSansfBengali.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
         {process.env.NODE_ENV === "production" && (
           <>
             <Analytics />
             <SpeedInsights />
           </>
         )}
      </body>
    </html>
  );
}
