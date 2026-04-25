// src/components/layout/CartButton.tsx
'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/useCart'

export default function CartButton() {
  const { cartCount: count } = useCart()

  return (
    <Link href="/cart" aria-label={`Cart — ${count} item${count !== 1 ? 's' : ''}`}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-all hover:scale-105 active:scale-95"
      >
        <ShoppingCart className="size-4" />
        {count > 0 && (
          <Badge className="absolute -right-1 -top-1 size-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground border border-background animate-in zoom-in duration-300">
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
 