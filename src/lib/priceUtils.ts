// src/lib/priceUtils.ts

export function calculateDiscount(
  regularPrice: number,
  salePrice?: number,
): number {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.floor(((regularPrice - salePrice) / regularPrice) * 100);
}

export function formatPrice(price: number): string {
  // 'Tk' প্রিফিক্স হিসেবে ব্যবহার করা হয়েছে।
  // আপনি চাইলে 'BDT ' বা 'Tk. ' ও দিতে পারেন।
  return (
    "Tk " +
    new Intl.NumberFormat("en-BD", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price)
  );
}
