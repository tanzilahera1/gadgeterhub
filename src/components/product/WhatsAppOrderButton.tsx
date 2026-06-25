// src/components/product/WhatsAppOrderButton.tsx
"use client";

import Link from "next/link";
import { MessageCircleMore } from "lucide-react";
import { IProduct } from "@/types/product";

interface WhatsAppOrderButtonProps {
  product: IProduct;
  quantity: number; // ← এই লাইন অ্যাড
}

export function WhatsAppOrderButton({ product, quantity }: WhatsAppOrderButtonProps) {
  const phoneNumber = "8801568390014"; 
  
  const price = product.salePrice || product.regularPrice;
  const total = price * quantity; // ← quantity দিয়ে গুণ
  
  const message = `*Gadget Collections Order*
  
প্রোডাক্ট: ${product.title}
দাম: ${price} টাকা/পিস
পরিমাণ: ${quantity} পিস
মোট: ${total} টাকা

আমি এই প্রোডাক্টটি অর্ডার করতে চাই।`;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      className="flex w-full items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-sm shadow-lg transition-all active:scale-95"
    >
      <MessageCircleMore className="size-5" />
      WhatsApp এ অর্ডার করুন
    </Link>
  );
}
