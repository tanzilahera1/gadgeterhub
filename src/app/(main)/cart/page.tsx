import { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "আপনার কার্ট | GadgetCollections",
  description: "আপনার পছন্দের গ্যাজেটগুলো চেকআউট করার জন্য তৈরি করুন।",
};

export default function CartPage() {
  return <CartPageClient />;
}
