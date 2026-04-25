// src/components/layout/PromoBar.tsx
import Link from 'next/link'
import { Truck, Phone } from 'lucide-react'

export default function PromoBar() {
  return (
    <aside className="bg-primary text-primary-foreground text-xs font-medium">
      <div className="container mx-auto flex h-9 items-center justify-center gap-2 px-4 sm:justify-between">
        <span className="flex items-center gap-1.5">
          <Truck className="size-3.5 shrink-0" />
          <span>৳999 এর উপরে অর্ডারে ফ্রি ডেলিভারি</span>
        </span>
        <Link
          href="tel:01700000000"
          className="hidden sm:flex items-center gap-1.5 font-bold hover:underline underline-offset-2 transition-all"
        >
          <Phone className="size-3.5 shrink-0" />
          <span>01700-000000</span>
        </Link>
      </div>
    </aside>
  )
}
